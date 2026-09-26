'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { applyKeysetParams, indexerValidators, takeKeysetPage } from '@/lib/indexer-json'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { ParticipantHistory } from '@/ui/dataview/datasections/participant'

const { record, string, integer, number } = indexerValidators('participant history')

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
      id: String(number(activity.id, `${path}.id`)),
      entity_id: string(activity.entity_id, `${path}.entity_id`),
      entity_type: string(activity.entity_type, `${path}.entity_type`),
      timestamp: string(activity.timestamp, `${path}.timestamp`),
      block_height: integer(activity.block_height, `${path}.block_height`),
      msg: string(activity.msg, `${path}.msg`),
      changes: activity.changes === null ? null : record(activity.changes, `${path}.changes`),
      account: string(activity.account, `${path}.account`),
    }
  })
}

export const PARTICIPANT_HISTORY_PAGE_SIZE = 25

export function useParticipantHistory(id?: string, pageSize = PARTICIPANT_HISTORY_PAGE_SIZE) {
  const [participantHistory, setParticipantHistory] = useState<ParticipantHistory[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorParticipantHistory, setError] = useState<string | null>(null)
  const participantRef = useRef<string | undefined>(undefined)

  const fetchPage = useCallback(
    async (participantId: string, after: string | undefined, append: boolean) => {
      if (!VERANA_REST_ENDPOINT_PARTICIPANT) {
        setParticipantHistory([])
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const params = new URLSearchParams()
        applyKeysetParams(params, { pageSize, after })
        const response = await fetch(
          `${VERANA_REST_ENDPOINT_PARTICIPANT}/history/${participantId}?${params.toString()}`
        )
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        const page = takeKeysetPage(parseParticipantHistoryResponse(json), pageSize)
        setParticipantHistory((current) => (append ? [...current, ...page.items] : page.items))
        setHasNext(page.hasNext)
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    },
    [pageSize]
  )

  const fetchParticipantHistory = useCallback(
    async (idOverride?: string) => {
      const participantId = idOverride ?? id
      if (!participantId) {
        setParticipantHistory([])
        setHasNext(false)
        setLoading(false)
        return
      }
      participantRef.current = participantId
      await fetchPage(participantId, undefined, false)
    },
    [fetchPage, id]
  )

  useEffect(() => {
    if (id) void fetchParticipantHistory(id)
  }, [fetchParticipantHistory, id])

  const loadMore = useCallback(() => {
    const participantId = participantRef.current
    const last = participantHistory[participantHistory.length - 1]
    if (participantId && last) void fetchPage(participantId, last.id, true)
  }, [fetchPage, participantHistory])

  return { participantHistory, loading, errorParticipantHistory, refetch: fetchParticipantHistory, hasNext, loadMore }
}
