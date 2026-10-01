'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM, VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import {
  parseVsOperatorAuthorizations,
  type VsOperatorAuthorizationRow,
  vsOperatorAuthorizationsUrl,
} from '@/hooks/useCorporationDetails'
import { parseEcosystemsResponse } from '@/hooks/useEcosystems'
import { parseParticipantsResponse } from '@/hooks/useParticipants'
import { translate } from '@/i18n/dataview'
import { type IndexerEntityEvent, refreshesEntityLists, SESSION_EVENT } from '@/lib/indexer-event'
import { applyKeysetParams, degrade, fetchJson, takeKeysetPage } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'
import {
  type AgentResolution,
  ALL_PARTICIPATION_STATES,
  fetchAgentResolution,
  invalidateDid,
  type ParticipationState,
} from '@/lib/resolverClient'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'

type AgentLabel = 'corporation' | 'ecosystem' | null

export interface AgentEntry {
  did: string
  label: AgentLabel
  pinned: boolean
}

export interface DegradedAgentSections {
  ecosystems: boolean
  delegations: boolean
}

const NOTHING_DEGRADED: DegradedAgentSections = { ecosystems: false, delegations: false }

interface AgentSources {
  corporationDid: string
  ecosystemDids: string[]
  participantDids: string[]
}

const ACTIVE_ONLY: readonly ParticipationState[] = ['ACTIVE']

export const AGENTS_PAGE_SIZE = 25

// Per [VFE-DATA-IDX-1] both sources of the agent set are read as cursor pages, never as one capped request.
export function agentParticipantsUrl(
  base: string,
  corporationId: number,
  includeInactive: boolean,
  pageSize: number,
  after?: string
): string {
  const params = new URLSearchParams({ corporation_id: String(corporationId) })
  applyKeysetParams(params, { pageSize, after })
  if (!includeInactive) params.set('participant_state', 'ACTIVE')
  return `${base}/list?${params.toString()}`
}

export function agentEcosystemsUrl(base: string, corporationId: number, pageSize: number, after?: string): string {
  const params = new URLSearchParams({ corporation_id: String(corporationId) })
  applyKeysetParams(params, { pageSize, after })
  return `${base}/list?${params.toString()}`
}

type AgentPage<T> = { items: T[]; hasNext: boolean }

function noMore<T>(): AgentPage<T> {
  return { items: [], hasNext: false }
}

/** The rows the agent cards are derived from, grown one cursor page at a time. */
type AgentWindow = {
  participants: Participant[]
  ecosystems: EcosystemListItem[]
  participantsHasNext: boolean
  ecosystemsHasNext: boolean
}

const EMPTY_WINDOW: AgentWindow = {
  participants: [],
  ecosystems: [],
  participantsHasNext: false,
  ecosystemsHasNext: false,
}

function cursor(rows: { id: string }[]): string | undefined {
  return rows[rows.length - 1]?.id
}

async function nextPage<T>(url: string, context: string, parse: (payload: unknown) => T[]): Promise<AgentPage<T>> {
  return takeKeysetPage(parse(await fetchJson(url, context)), AGENTS_PAGE_SIZE)
}

// Per [VFE-PAGE-AGENTS-1] agents come from Participant DIDs only; VSOA entries never add an agent.
// Per [VFE-PAGE-AGENTS-1a] the Corporation DID and the controlled Ecosystem DIDs stay pinned first, as one card each.
export function buildAgentList({ corporationDid, ecosystemDids, participantDids }: AgentSources): AgentEntry[] {
  const seen = new Set<string>()
  const agents: AgentEntry[] = []
  const add = (did: string, label: AgentLabel) => {
    if (!did || seen.has(did)) return
    seen.add(did)
    agents.push({ did, label, pinned: label !== null })
  }
  add(corporationDid, 'corporation')
  for (const did of ecosystemDids) add(did, 'ecosystem')
  for (const did of participantDids) add(did, null)
  return agents
}

export function agentRefreshNeeded(
  events: IndexerEntityEvent[],
  corporationId: number,
  knownDids: Set<string>
): { lists: boolean; dids: string[] } {
  const dids = new Set<string>()
  let lists = false
  for (const event of events) {
    if (event.eventType !== SESSION_EVENT) {
      for (const did of [event.did, ...event.relatedDids]) {
        if (did && knownDids.has(did)) dids.add(did)
      }
    }
    if (refreshesEntityLists(event, corporationId, knownDids)) lists = true
  }
  return { lists, dids: [...dids] }
}

export function useAgents(corporation: { id: number; did: string } | undefined, includeInactive: boolean) {
  const corporationId = corporation?.id
  const corporationDid = corporation?.did
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [delegations, setDelegations] = useState<Map<number, VsOperatorAuthorizationRow>>(new Map())
  const [degraded, setDegraded] = useState<DegradedAgentSections>(NOTHING_DEGRADED)
  const [resolutions, setResolutions] = useState<Map<string, AgentResolution>>(new Map())
  const [unavailableDids, setUnavailableDids] = useState<ReadonlySet<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [agentWindow, setAgentWindow] = useState<AgentWindow>(EMPTY_WINDOW)
  const requestRef = useRef(0)
  const windowRef = useRef(agentWindow)
  const loadingMore = useRef(false)
  windowRef.current = agentWindow

  const states = includeInactive ? ALL_PARTICIPATION_STATES : ACTIVE_ONLY

  const load = useCallback(
    async ({ background = false, append = false }: { background?: boolean; append?: boolean } = {}) => {
      const requestId = ++requestRef.current
      if (corporationId === undefined || corporationDid === undefined) {
        setAgentWindow(EMPTY_WINDOW)
        setAgents([])
        setDelegations(new Map())
        setDegraded(NOTHING_DEGRADED)
        setError(null)
        setLoading(false)
        return
      }
      const participantBase = VERANA_REST_ENDPOINT_PARTICIPANT
      const ecosystemBase = VERANA_REST_ENDPOINT_ECOSYSTEM
      if (!participantBase || !ecosystemBase) {
        setAgentWindow(EMPTY_WINDOW)
        setAgents([])
        setDegraded(NOTHING_DEGRADED)
        setError(resolveTranslatable({ key: 'error.fetch.participant' }, translate) ?? 'Missing endpoint URL')
        setLoading(false)
        return
      }
      if (!background) setLoading(true)
      setError(null)
      // A reload that is not a show more starts over at the first page. The pages are sorted newest-first,
      // so the Participant an event just created lands on that page; replaying every loaded cursor would not.
      const base = append ? windowRef.current : EMPTY_WINDOW
      try {
        const [participants, ecosystems, authorizations] = await Promise.all([
          append && !base.participantsHasNext
            ? noMore<Participant>()
            : nextPage(
                agentParticipantsUrl(
                  participantBase,
                  corporationId,
                  includeInactive,
                  AGENTS_PAGE_SIZE,
                  cursor(base.participants)
                ),
                'Unable to fetch participants',
                parseParticipantsResponse
              ),
          degrade('agents ecosystems', noMore<EcosystemListItem>(), async () =>
            append && !base.ecosystemsHasNext
              ? noMore<EcosystemListItem>()
              : nextPage(
                  agentEcosystemsUrl(ecosystemBase, corporationId, AGENTS_PAGE_SIZE, cursor(base.ecosystems)),
                  'Unable to fetch ecosystems',
                  parseEcosystemsResponse
                )
          ),
          degrade('agents delegations', [] as VsOperatorAuthorizationRow[], () =>
            fetchJson(
              vsOperatorAuthorizationsUrl(corporationId, false),
              'Unable to fetch VS operator authorizations'
            ).then(parseVsOperatorAuthorizations)
          ),
        ])
        if (requestRef.current !== requestId) return
        const next: AgentWindow = {
          participants: [...base.participants, ...participants.items],
          ecosystems: [...base.ecosystems, ...ecosystems.value.items],
          participantsHasNext: participants.hasNext,
          // A page that failed keeps its show more, so the window is not capped by one bad request.
          ecosystemsHasNext: ecosystems.failed ? base.ecosystemsHasNext : ecosystems.value.hasNext,
        }
        setAgentWindow(next)
        setAgents(
          buildAgentList({
            corporationDid,
            ecosystemDids: next.ecosystems.map((ecosystem) => ecosystem.did),
            participantDids: next.participants.flatMap((participant) => (participant.did ? [participant.did] : [])),
          })
        )
        setDelegations(new Map(authorizations.value.map((row) => [row.participantId, row])))
        setDegraded({ ecosystems: ecosystems.failed, delegations: authorizations.failed })
      } catch (cause) {
        if (requestRef.current !== requestId) return
        setAgentWindow(base)
        setAgents([])
        setDegraded(NOTHING_DEGRADED)
        setError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        if (requestRef.current === requestId) setLoading(false)
      }
    },
    [corporationId, corporationDid, includeInactive]
  )

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = useCallback(() => {
    // The cursor only moves once the page lands, so without the guard a second click appends the same page again.
    if (loadingMore.current) return
    loadingMore.current = true
    void load({ append: true, background: true }).finally(() => {
      loadingMore.current = false
    })
  }, [load])

  const didsKey = agents.map((agent) => agent.did).join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadToken re-runs the resolve after a cache invalidation
  useEffect(() => {
    const dids = didsKey ? didsKey.split('|') : []
    if (dids.length === 0) {
      setResolutions(new Map())
      setUnavailableDids(new Set())
      return
    }
    let cancelled = false
    for (const did of dids) {
      fetchAgentResolution(did, states)
        .then((resolution) => {
          if (cancelled) return
          setResolutions((current) => new Map(current).set(did, resolution))
          setUnavailableDids((current) => {
            if (!current.has(did)) return current
            const next = new Set(current)
            next.delete(did)
            return next
          })
        })
        .catch((cause) => {
          logger.error(`agent resolve ${did}`, cause)
          if (!cancelled) setUnavailableDids((current) => new Set(current).add(did))
        })
    }
    return () => {
      cancelled = true
    }
  }, [didsKey, states, reloadToken])

  const knownDids = useMemo(() => new Set(didsKey ? didsKey.split('|') : []), [didsKey])
  const applyEvents = useCallback(
    (events: IndexerEntityEvent[]) => {
      if (corporationId === undefined) return
      const { lists, dids } = agentRefreshNeeded(events, corporationId, knownDids)
      for (const did of dids) invalidateDid(did)
      if (lists) void load({ background: true })
      if (dids.length > 0) setReloadToken((token) => token + 1)
    },
    [corporationId, knownDids, load]
  )

  return {
    agents,
    delegations,
    degraded,
    resolutions,
    unavailableDids,
    loading,
    error,
    hasNext: agentWindow.participantsHasNext || agentWindow.ecosystemsHasNext,
    loadMore,
    refetch: load,
    applyEvents,
  }
}
