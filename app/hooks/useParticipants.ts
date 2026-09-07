'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { indexerValidators } from '@/lib/indexer-json'
import { type KeysetRequest, keysetQuery, keysetWindow } from '@/lib/keyset'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { Participant } from '@/ui/dataview/datasections/participant'

const { record } = indexerValidators('participants')

export const SIBLING_PAGE_SIZE = 25

export type ParticipantListOptions = {
  afterId?: string
  pageSize?: number
}

export function parseParticipantsResponse(payload: unknown): Participant[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.participants)) {
    throw new Error('Invalid participants response: missing participants envelope')
  }
  return envelope.participants.map((participant, index) =>
    parseParticipantRecord(participant, `participants[${index}]`)
  )
}

export function siblingRequest({ afterId, pageSize = SIBLING_PAGE_SIZE }: ParticipantListOptions = {}): KeysetRequest {
  return {
    limit: pageSize,
    sort: '+id',
    direction: 'forward',
    boundary: afterId === undefined ? undefined : Number(afterId),
  }
}

export function participantListQuery(
  schemaId: string,
  role?: string,
  validatorParticipantId?: string,
  options: ParticipantListOptions = {}
): URLSearchParams {
  const params = new URLSearchParams(keysetQuery(siblingRequest(options)))
  params.set('schema_id', schemaId)
  params.set('trust_data', 'full')
  if (role) params.set('role', role)
  if (validatorParticipantId) params.set('validator_participant_id', validatorParticipantId)
  return params
}

export function useParticipants(
  schemaId?: string,
  role?: string,
  validatorParticipantId?: string,
  { afterId, pageSize = SIBLING_PAGE_SIZE }: ParticipantListOptions = {}
) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadedFor, setLoadedFor] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [errorParticipants, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(
    async (schemaOverride?: string, roleOverride?: string, validatorOverride?: string, afterOverride?: string) => {
      const schema = schemaOverride ?? schemaId
      const participantRole = roleOverride ?? role
      const validator = validatorOverride ?? validatorParticipantId
      const options = { afterId: afterOverride ?? afterId, pageSize }
      if (!schema || !VERANA_REST_ENDPOINT_PARTICIPANT || (!participantRole && !validator)) {
        setParticipants([])
        setHasMore(false)
        setLoadedFor(undefined)
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const params = participantListQuery(schema, participantRole, validator, options)
        const response = await fetch(`${VERANA_REST_ENDPOINT_PARTICIPANT}/list?${params.toString()}`)
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        const window = keysetWindow(siblingRequest(options), parseParticipantsResponse(json))
        setParticipants(window.rows)
        setHasMore(window.hasNext)
        setLoadedFor(params.toString())
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    },
    [afterId, pageSize, role, schemaId, validatorParticipantId]
  )

  useEffect(() => {
    if (schemaId) void fetchParticipants(schemaId, role, validatorParticipantId, afterId)
  }, [afterId, fetchParticipants, role, schemaId, validatorParticipantId])

  return { participants, hasMore, loadedFor, loading, errorParticipants, refetch: fetchParticipants }
}
