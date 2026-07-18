'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { ParticipantHistory } from '@/ui/dataview/datasections/participant'

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid participant history response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid participant history response: ${path}`)
  return value
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid participant history response: ${path}`)
  }
  return value
}

export function parseParticipantHistoryResponse(payload: unknown): ParticipantHistory[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.activity)) {
    throw new Error('Invalid participant history response: missing activity envelope')
  }
  string(envelope.entity_type, 'entity_type')
  string(envelope.entity_id, 'entity_id')
  return envelope.activity.map((value, index) => {
    const path = `activity[${index}]`
    const activity = record(value, path)
    return {
      entity_id: string(activity.entity_id, `${path}.entity_id`),
      entity_type: string(activity.entity_type, `${path}.entity_type`),
      timestamp: string(activity.timestamp, `${path}.timestamp`),
      block_height: number(activity.block_height, `${path}.block_height`),
      msg: string(activity.msg, `${path}.msg`),
      changes: activity.changes === null ? null : record(activity.changes, `${path}.changes`),
      account: string(activity.account, `${path}.account`),
    }
  })
}

export function useParticipantHistory(id?: string) {
  const [participantHistory, setParticipantHistory] = useState<ParticipantHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [errorParticipantHistory, setError] = useState<string | null>(null)

  const fetchParticipantHistory = useCallback(
    async (idOverride?: string) => {
      const participantId = idOverride ?? id
      if (!participantId || !VERANA_REST_ENDPOINT_PARTICIPANT) {
        setParticipantHistory([])
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const response = await fetch(
          `${VERANA_REST_ENDPOINT_PARTICIPANT}/history/${participantId}?response_max_size=1000`
        )
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        setParticipantHistory(parseParticipantHistoryResponse(json))
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    if (id) void fetchParticipantHistory(id)
  }, [fetchParticipantHistory, id])

  return { participantHistory, loading, errorParticipantHistory, refetch: fetchParticipantHistory }
}
