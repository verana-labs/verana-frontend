'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { Participant } from '@/ui/dataview/datasections/participant'

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid participants response: ${path}`)
  }
  return value as Record<string, unknown>
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

export function useParticipants(schemaId?: string, role?: string, validatorParticipantId?: string) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [errorParticipants, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(
    async (schemaOverride?: string, roleOverride?: string, validatorOverride?: string) => {
      const schema = schemaOverride ?? schemaId
      const participantRole = roleOverride ?? role
      const validator = validatorOverride ?? validatorParticipantId
      if (!schema || !VERANA_REST_ENDPOINT_PARTICIPANT || (!participantRole && !validator)) {
        setParticipants([])
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const params = new URLSearchParams({ schema_id: schema, response_max_size: '1024', sort: '+id' })
        if (participantRole) params.set('role', participantRole)
        if (validator) params.set('validator_participant_id', validator)
        const response = await fetch(`${VERANA_REST_ENDPOINT_PARTICIPANT}/list?${params.toString()}`)
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        setParticipants(parseParticipantsResponse(json))
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    },
    [role, schemaId, validatorParticipantId]
  )

  useEffect(() => {
    if (schemaId) void fetchParticipants(schemaId, role, validatorParticipantId)
  }, [fetchParticipants, role, schemaId, validatorParticipantId])

  return { participants, loading, errorParticipants, refetch: fetchParticipants }
}
