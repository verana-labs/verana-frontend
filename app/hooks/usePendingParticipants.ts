'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid pending participants response: ${path}`)
  }
  return value as Record<string, unknown>
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid pending participants response: ${path}`)
  }
  return value
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid pending participants response: ${path}`)
  return value
}

export function parsePendingParticipantsResponse(payload: unknown): PendingEcosystem[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.ecosystems)) {
    throw new Error('Invalid pending participants response: missing ecosystems envelope')
  }

  return envelope.ecosystems.map((value, ecosystemIndex) => {
    const path = `ecosystems[${ecosystemIndex}]`
    const ecosystem = record(value, path)
    if (!Array.isArray(ecosystem.schemas)) {
      throw new Error(`Invalid pending participants response: ${path}.schemas`)
    }
    return {
      id: String(number(ecosystem.id, `${path}.id`)),
      did: ecosystem.did === null ? null : string(ecosystem.did, `${path}.did`),
      pending_tasks: number(ecosystem.pending_tasks, `${path}.pending_tasks`),
      participants: number(ecosystem.participants, `${path}.participants`),
      schemas: ecosystem.schemas.map((value, schemaIndex) => {
        const schemaPath = `${path}.schemas[${schemaIndex}]`
        const schema = record(value, schemaPath)
        if (!Array.isArray(schema.pending_participants)) {
          throw new Error(`Invalid pending participants response: ${schemaPath}.pending_participants`)
        }
        return {
          id: String(number(schema.id, `${schemaPath}.id`)),
          title: string(schema.title, `${schemaPath}.title`),
          description: schema.description === null ? null : string(schema.description, `${schemaPath}.description`),
          pending_tasks: number(schema.pending_tasks, `${schemaPath}.pending_tasks`),
          pending_participants: schema.pending_participants.map((participant, participantIndex) =>
            parseParticipantRecord(participant, `${schemaPath}.pending_participants[${participantIndex}]`)
          ),
        }
      }),
    }
  })
}

export function usePendingParticipants() {
  const { corporation } = useUserCorporation()
  const corporationAddress = corporation?.policyAddress
  const [pendingParticipants, setPendingParticipants] = useState<PendingEcosystem[]>([])
  const [loading, setLoading] = useState(false)
  const [errorPendingParticipants, setError] = useState<string | null>(null)

  const fetchPendingParticipants = useCallback(async () => {
    if (!corporationAddress || !VERANA_REST_ENDPOINT_PARTICIPANT) {
      setPendingParticipants([])
      setLoading(false)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const response = await fetch(
        `${VERANA_REST_ENDPOINT_PARTICIPANT}/pending/flat?account=${encodeURIComponent(corporationAddress)}`
      )
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      setPendingParticipants(parsePendingParticipantsResponse(json))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [corporationAddress])

  useEffect(() => {
    if (corporationAddress) void fetchPendingParticipants()
  }, [corporationAddress, fetchPendingParticipants])

  return { pendingParticipants, loading, errorPendingParticipants, refetch: fetchPendingParticipants }
}
