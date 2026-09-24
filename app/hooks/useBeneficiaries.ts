'use client'

import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantRecord } from '@/hooks/useParticipant'
import { indexerValidators } from '@/lib/indexer-json'
import type { Participant } from '@/ui/dataview/datasections/participant'

const { record } = indexerValidators('beneficiaries')

export type BeneficiariesQuery = { issuerParticipantId?: string; verifierParticipantId?: string }

export type BeneficiariesSubject = Pick<Participant, 'id' | 'role' | 'participant_state'>

export function beneficiariesQuery(participant: BeneficiariesSubject): BeneficiariesQuery | null {
  if (participant.participant_state !== 'ACTIVE') return null
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

export type BeneficiariesState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; beneficiaries: Participant[] }

export async function loadBeneficiaries(url: string, fetchImpl: typeof fetch = fetch): Promise<BeneficiariesState> {
  try {
    const response = await fetchImpl(url)
    if (!response.ok) return { status: 'failed' }
    return { status: 'ready', beneficiaries: parseBeneficiariesResponse(await response.json()) }
  } catch {
    return { status: 'failed' }
  }
}

export function useBeneficiaries(participant: BeneficiariesSubject | undefined): BeneficiariesState | null {
  const [result, setResult] = useState<{ url: string; state: BeneficiariesState } | null>(null)
  const query = participant ? beneficiariesQuery(participant) : null
  const url =
    query && VERANA_REST_ENDPOINT_PARTICIPANT ? beneficiariesUrl(VERANA_REST_ENDPOINT_PARTICIPANT, query) : null

  useEffect(() => {
    if (!url) return
    let cancelled = false
    void loadBeneficiaries(url).then((state) => {
      if (!cancelled) setResult({ url, state })
    })
    return () => {
      cancelled = true
    }
  }, [url])

  if (!url) return null
  return result?.url === url ? result.state : { status: 'loading' }
}
