'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { applyKeysetParams, indexerValidators, takeKeysetPage } from '@/lib/indexer-json'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { Participant } from '@/ui/dataview/datasections/participant'

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

export function useParticipants(
  schemaId?: string,
  role?: string,
  validatorParticipantId?: string,
  pageSize = PARTICIPANTS_PAGE_SIZE
) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorParticipants, setError] = useState<string | null>(null)
  const requestRef = useRef(0)
  const queryRef = useRef<ParticipantQuery>({})

  const fetchPage = useCallback(
    async (query: ParticipantQuery, after: string | undefined, append: boolean) => {
      const request = ++requestRef.current
      if (!query.schema || !VERANA_REST_ENDPOINT_PARTICIPANT || (!query.role && !query.validator)) {
        setParticipants([])
        setHasNext(false)
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const params = new URLSearchParams({ schema_id: query.schema, trust_data: 'full' })
        applyKeysetParams(params, { pageSize, after, sort: '+id' })
        if (query.role) params.set('role', query.role)
        if (query.validator) params.set('validator_participant_id', query.validator)
        const response = await fetch(`${VERANA_REST_ENDPOINT_PARTICIPANT}/list?${params.toString()}`)
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        const page = takeKeysetPage(parseParticipantsResponse(json), pageSize)
        if (request !== requestRef.current) return
        setParticipants((current) => (append ? [...current, ...page.items] : page.items))
        setHasNext(page.hasNext)
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
      await fetchPage(query, undefined, false)
    },
    [fetchPage, role, schemaId, validatorParticipantId]
  )

  useEffect(() => {
    if (schemaId) void fetchParticipants(schemaId, role, validatorParticipantId)
  }, [fetchParticipants, role, schemaId, validatorParticipantId])

  const loadMore = useCallback(() => {
    const last = participants[participants.length - 1]
    if (last) void fetchPage(queryRef.current, last.id, true)
  }, [fetchPage, participants])

  return { participants, loading, errorParticipants, refetch: fetchParticipants, hasNext, loadMore }
}
