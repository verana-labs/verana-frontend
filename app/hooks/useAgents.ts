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
import { concernsCorporation, type IndexerEntityEvent } from '@/lib/indexer-event'
import { degrade, fetchJson } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'
import {
  type AgentResolution,
  ALL_PARTICIPATION_STATES,
  fetchAgentResolution,
  invalidateDid,
  type ParticipationState,
} from '@/lib/resolverClient'

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
const REFRESH_MODULES = new Set(['pp', 'de'])
const SESSION_EVENT = 'CreateOrUpdateParticipantSession'
const RESOLVER_EVENT = 'TriggerResolver'
const LIST_NEUTRAL_EVENTS = new Set([SESSION_EVENT, RESOLVER_EVENT])

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
    if (
      !LIST_NEUTRAL_EVENTS.has(event.eventType) &&
      REFRESH_MODULES.has(event.module) &&
      concernsCorporation(event, corporationId, knownDids)
    ) {
      lists = true
    }
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
  const requestRef = useRef(0)

  const states = includeInactive ? ALL_PARTICIPATION_STATES : ACTIVE_ONLY

  const load = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      const requestId = ++requestRef.current
      if (corporationId === undefined || corporationDid === undefined) {
        setAgents([])
        setDelegations(new Map())
        setDegraded(NOTHING_DEGRADED)
        setError(null)
        setLoading(false)
        return
      }
      if (!background) setLoading(true)
      setError(null)
      try {
        const participantParams = new URLSearchParams({ corporation_id: String(corporationId), limit: '1024' })
        if (!includeInactive) participantParams.set('participant_state', 'ACTIVE')
        const [participants, ecosystems, authorizations] = await Promise.all([
          fetchJson(
            `${VERANA_REST_ENDPOINT_PARTICIPANT}/list?${participantParams}`,
            'Unable to fetch participants'
          ).then(parseParticipantsResponse),
          degrade('agents ecosystems', [] as { did: string }[], () =>
            fetchJson(
              `${VERANA_REST_ENDPOINT_ECOSYSTEM}/list?corporation_id=${corporationId}&limit=1024`,
              'Unable to fetch ecosystems'
            ).then(parseEcosystemsResponse)
          ),
          degrade('agents delegations', [] as VsOperatorAuthorizationRow[], () =>
            fetchJson(
              vsOperatorAuthorizationsUrl(corporationId, false),
              'Unable to fetch VS operator authorizations'
            ).then(parseVsOperatorAuthorizations)
          ),
        ])
        if (requestRef.current !== requestId) return
        setAgents(
          buildAgentList({
            corporationDid,
            ecosystemDids: ecosystems.value.map((ecosystem) => ecosystem.did),
            participantDids: participants.flatMap((participant) => (participant.did ? [participant.did] : [])),
          })
        )
        setDelegations(new Map(authorizations.value.map((row) => [row.participantId, row])))
        setDegraded({ ecosystems: ecosystems.failed, delegations: authorizations.failed })
      } catch (cause) {
        if (requestRef.current !== requestId) return
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

  return { agents, delegations, degraded, resolutions, unavailableDids, loading, error, refetch: load, applyEvents }
}
