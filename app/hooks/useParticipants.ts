'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { applyKeysetParams, indexerValidators, takeKeysetPage } from '@/lib/indexer-json'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { Participant, ParticipantState } from '@/ui/dataview/datasections/participant'

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
  participantState?: ParticipantState
  trustData?: 'summary' | 'full'
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
  participantState?: ParticipantState
  trustData: 'summary' | 'full'
  pageSize: number
  after?: string
}

export function participantsListUrl(base: string, request: ParticipantsRequest): string {
  const params = new URLSearchParams({ schema_id: request.schema, trust_data: request.trustData })
  applyKeysetParams(params, { pageSize: request.pageSize, after: request.after, sort: '+id' })
  if (request.role) params.set('role', request.role)
  if (request.validator) params.set('validator_participant_id', request.validator)
  if (request.participantState) params.set('participant_state', request.participantState)
  return `${base}/list?${params.toString()}`
}

export function useParticipants(
  schemaId?: string,
  role?: string,
  validatorParticipantId?: string,
  options: ParticipantsOptions = {}
) {
  const { participantState, trustData = 'full', pageSize = PARTICIPANTS_PAGE_SIZE, after } = options
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
        // A new query starts from an empty window, so a show more cannot append its page after the previous cursor.
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
          participantState,
          trustData,
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
    [pageSize, participantState, trustData]
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

  const loadMore = useCallback(() => {
    const last = participants[participants.length - 1]
    if (last) void fetchPage(queryRef.current, last.id, true)
  }, [fetchPage, participants])

  return { participants, pageKey, loading, errorParticipants, refetch: fetchParticipants, hasNext, loadMore }
}
