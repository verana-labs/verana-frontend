'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { useLoadMore } from '@/hooks/useKeysetPages'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { groupRolesByEcosystem, groupRolesBySchema } from '@/lib/discover-list'
import { applyKeysetParams, fetchJson, indexerValidators, takeKeysetPage } from '@/lib/indexer-json'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { Participant, ParticipantRole } from '@/ui/dataview/datasections/participant'

const { record } = indexerValidators('participants')

export function parseParticipantsResponse(payload: unknown): Participant[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.participants)) {
    throw new Error('Invalid participants response: missing participants envelope')
  }
  return envelope.participants.map((participant, index) =>
    parseParticipantRecord(participant, `participants[${index}]`)
  )
}

export const PARTICIPANTS_PAGE_SIZE = 25

type ParticipantQuery = { schema?: string; role?: string; validator?: string }

export type ParticipantsOptions = {
  pageSize?: number
  after?: string
}

export function participantsPageKey(request: ParticipantQuery & { after?: string }): string {
  return [request.schema ?? '', request.role ?? '', request.validator ?? '', request.after ?? ''].join('|')
}

type ParticipantsRequest = {
  schema: string
  role?: string
  validator?: string
  trustData: 'summary' | 'full'
  pageSize: number
  after?: string
}

export function participantsListUrl(base: string, request: ParticipantsRequest): string {
  const params = new URLSearchParams({ schema_id: request.schema, trust_data: request.trustData })
  applyKeysetParams(params, { pageSize: request.pageSize, after: request.after, sort: '+id' })
  if (request.role) params.set('role', request.role)
  if (request.validator) params.set('validator_participant_id', request.validator)
  return `${base}/list?${params.toString()}`
}

export function useParticipants(
  schemaId?: string,
  role?: string,
  validatorParticipantId?: string,
  options: ParticipantsOptions = {}
) {
  const { pageSize = PARTICIPANTS_PAGE_SIZE, after } = options
  const [participants, setParticipants] = useState<Participant[]>([])
  const [pageKey, setPageKey] = useState('')
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorParticipants, setError] = useState<string | null>(null)
  const requestRef = useRef(0)
  const queryRef = useRef<ParticipantQuery>({})
  const queryKeyRef = useRef('')

  const fetchPage = useCallback(
    async (query: ParticipantQuery, cursor: string | undefined, append: boolean) => {
      const request = ++requestRef.current
      const key = participantsPageKey({ ...query, after: cursor })
      const queryKey = participantsPageKey(query)
      if (queryKey !== queryKeyRef.current) {
        queryKeyRef.current = queryKey
        setParticipants([])
        setHasNext(false)
        setPageKey('')
      }
      if (!query.schema || !VERANA_REST_ENDPOINT_PARTICIPANT || (!query.role && !query.validator)) {
        setParticipants([])
        setHasNext(false)
        setPageKey(key)
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const url = participantsListUrl(VERANA_REST_ENDPOINT_PARTICIPANT, {
          schema: query.schema,
          role: query.role,
          validator: query.validator,
          trustData: 'full',
          pageSize,
          after: cursor,
        })
        const response = await fetch(url)
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        const page = takeKeysetPage(parseParticipantsResponse(json), pageSize)
        if (request !== requestRef.current) return
        setParticipants((current) => (append ? [...current, ...page.items] : page.items))
        setHasNext(page.hasNext)
        setPageKey(key)
      } catch (error) {
        if (request === requestRef.current) setError(error instanceof Error ? error.message : String(error))
      } finally {
        if (request === requestRef.current) setLoading(false)
      }
    },
    [pageSize]
  )

  const fetchParticipants = useCallback(
    async (schemaOverride?: string, roleOverride?: string, validatorOverride?: string) => {
      const query: ParticipantQuery = {
        schema: schemaOverride ?? schemaId,
        role: roleOverride ?? role,
        validator: validatorOverride ?? validatorParticipantId,
      }
      queryRef.current = query
      await fetchPage(query, after, false)
    },
    [after, fetchPage, role, schemaId, validatorParticipantId]
  )

  useEffect(() => {
    if (schemaId) void fetchParticipants(schemaId, role, validatorParticipantId)
  }, [fetchParticipants, role, schemaId, validatorParticipantId])

  const loadMore = useLoadMore(async () => {
    const last = participants[participants.length - 1]
    if (last) await fetchPage(queryRef.current, last.id, true)
  })

  return { participants, pageKey, loading, errorParticipants, refetch: fetchParticipants, hasNext, loadMore }
}

const ROLE_LOOKUP_PAGE_SIZE = 64

function corporationParticipantsUrl(base: string, corporationId: number, after?: string): string {
  const params = new URLSearchParams({ corporation_id: String(corporationId), participant_state: 'ACTIVE' })
  applyKeysetParams(params, { pageSize: ROLE_LOOKUP_PAGE_SIZE, after })
  return `${base}/list?${params.toString()}`
}

export async function fetchCorporationParticipants(
  base: string,
  corporationId: number
): Promise<{ participants: Participant[]; failureReason: string | null }> {
  const participants: Participant[] = []
  let after: string | undefined
  try {
    for (;;) {
      const payload = await fetchJson(
        corporationParticipantsUrl(base, corporationId, after),
        'Unable to fetch participants'
      )
      const page = takeKeysetPage(parseParticipantsResponse(payload), ROLE_LOOKUP_PAGE_SIZE)
      participants.push(...page.items)
      const last = page.items[page.items.length - 1]?.id
      if (!page.hasNext || last === undefined || last === after) return { participants, failureReason: null }
      after = last
    }
  } catch (error) {
    return { participants, failureReason: error instanceof Error ? error.message : String(error) }
  }
}

const NO_ROLES: Record<string, ParticipantRole[]> = {}

type RoleLookup = {
  corporationId: number
  rolesByEcosystem: Record<string, ParticipantRole[]>
  rolesBySchema: Record<string, ParticipantRole[]>
  failureReason: string | null
}

export function useCorporationRoles(corporationId: number | undefined) {
  const enabled = corporationId !== undefined && Boolean(VERANA_REST_ENDPOINT_PARTICIPANT)
  const [lookup, setLookup] = useState<RoleLookup | null>(null)

  useEffect(() => {
    const endpoint = VERANA_REST_ENDPOINT_PARTICIPANT
    if (corporationId === undefined || !endpoint) return
    let cancelled = false
    void fetchCorporationParticipants(endpoint, corporationId).then(({ participants, failureReason }) => {
      if (cancelled) return
      setLookup({
        corporationId,
        rolesByEcosystem: groupRolesByEcosystem(participants),
        rolesBySchema: groupRolesBySchema(participants),
        failureReason,
      })
    })
    return () => {
      cancelled = true
    }
  }, [corporationId])

  const current = enabled && lookup?.corporationId === corporationId ? lookup : null
  return {
    rolesByEcosystem: current?.rolesByEcosystem ?? NO_ROLES,
    rolesBySchema: current?.rolesBySchema ?? NO_ROLES,
    rolesLoading: enabled && current === null,
    failureReason: current?.failureReason ?? null,
  }
}
