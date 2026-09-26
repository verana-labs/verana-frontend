'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { indexerValidators } from '@/lib/indexer-json'
import { enrichmentFromTrustData } from '@/lib/resolverClient'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'

const { record, string, number } = indexerValidators('pending participants')

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
    const did = ecosystem.did === null ? null : string(ecosystem.did, `${path}.did`)
    return {
      id: String(number(ecosystem.id, `${path}.id`)),
      did,
      trustData: did === null ? undefined : enrichmentFromTrustData(did, ecosystem.trust_data),
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

// The pending task list carries its identity inline, per [VFE-PAGE-PENDING-1].
// The method has no keyset cursor, so it keeps the maximum ecosystem limit.
export function pendingParticipantsUrl(endpoint: string, corporationId: number): string {
  return `${endpoint}/pending/flat?corporation_id=${corporationId}&trust_data=summary&limit=1024`
}

export function usePendingParticipants() {
  const { actingCorporation } = useUserCorporation()
  const corporationId = actingCorporation?.corporation.id
  const [pendingParticipants, setPendingParticipants] = useState<PendingEcosystem[]>([])
  const [loading, setLoading] = useState(true)
  const [settled, setSettled] = useState(false)
  const [errorPendingParticipants, setError] = useState<string | null>(null)
  const requestRef = useRef(0)
  const corporationRef = useRef<number | undefined>(undefined)

  const fetchPendingParticipants = useCallback(async () => {
    const request = ++requestRef.current
    if (corporationRef.current !== corporationId) {
      corporationRef.current = corporationId
      setPendingParticipants([])
      setSettled(false)
    }
    if (corporationId === undefined || !VERANA_REST_ENDPOINT_PARTICIPANT) {
      setError(null)
      setLoading(false)
      setSettled(true)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const response = await fetch(pendingParticipantsUrl(VERANA_REST_ENDPOINT_PARTICIPANT, corporationId))
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      if (request === requestRef.current) setPendingParticipants(parsePendingParticipantsResponse(json))
    } catch (error) {
      if (request === requestRef.current) setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (request === requestRef.current) {
        setLoading(false)
        setSettled(true)
      }
    }
  }, [corporationId])

  useEffect(() => {
    void fetchPendingParticipants()
  }, [fetchPendingParticipants])

  return { pendingParticipants, loading, settled, errorPendingParticipants, refetch: fetchPendingParticipants }
}
