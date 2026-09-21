'use client'

import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { indexerValidators } from '@/lib/indexer-json'
import type { Participant } from '@/ui/dataview/datasections/participant'

const { record } = indexerValidators('beneficiaries')

export type BeneficiariesQuery = { issuerParticipantId?: string; verifierParticipantId?: string }

export function beneficiariesQuery(participant: Pick<Participant, 'id' | 'role'>): BeneficiariesQuery | null {
  if (participant.role === 'ISSUER') return { issuerParticipantId: participant.id }
  if (participant.role === 'VERIFIER') return { verifierParticipantId: participant.id }
  return null
}

export function beneficiariesUrl(endpoint: string, query: BeneficiariesQuery): string {
  const params = new URLSearchParams()
  if (query.issuerParticipantId) params.set('issuer_participant_id', query.issuerParticipantId)
  if (query.verifierParticipantId) params.set('verifier_participant_id', query.verifierParticipantId)
  return `${endpoint}/beneficiaries?${params.toString()}`
}

export function parseBeneficiariesResponse(payload: unknown): Participant[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.participants)) {
    throw new Error('Invalid beneficiaries response: missing participants envelope')
  }
  return envelope.participants.map((participant, index) =>
    parseParticipantRecord(participant, `participants[${index}]`)
  )
}

export function useBeneficiaries(participant: Pick<Participant, 'id' | 'role'> | undefined): Participant[] | null {
  const [beneficiaries, setBeneficiaries] = useState<Participant[] | null>(null)
  const query = participant ? beneficiariesQuery(participant) : null
  const url =
    query && VERANA_REST_ENDPOINT_PARTICIPANT ? beneficiariesUrl(VERANA_REST_ENDPOINT_PARTICIPANT, query) : null

  useEffect(() => {
    setBeneficiaries(null)
    if (!url) return
    let cancelled = false
    fetch(url)
      .then(async (response) => (response.ok ? parseBeneficiariesResponse(await response.json()) : null))
      .catch(() => null)
      .then((result) => {
        if (!cancelled) setBeneficiaries(result)
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return beneficiaries
}
