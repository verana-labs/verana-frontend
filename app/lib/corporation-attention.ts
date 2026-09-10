import { VERANA_REST_ENDPOINT_GROUP, VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { indexerValidators } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'

export interface CorporationAttention {
  pendingTasks: number
  pendingVotes: number
}

const { record, number } = indexerValidators('attention')

export function attentionUrls(corporationId: number, account: string): { pendingTasks: string; pendingVotes: string } {
  return {
    pendingTasks: `${VERANA_REST_ENDPOINT_PARTICIPANT}/pending/flat?corporation_id=${corporationId}&limit=1024`,
    pendingVotes: `${VERANA_REST_ENDPOINT_GROUP}/proposals?corporation_id=${corporationId}&pending_voter=${encodeURIComponent(account)}&limit=1024`,
  }
}

export function countPendingTasks(payload: unknown): number {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.ecosystems)) throw new Error('Invalid attention response: missing ecosystems envelope')
  return envelope.ecosystems.reduce<number>(
    (total, value, index) =>
      total + number(record(value, `ecosystems[${index}]`).pending_tasks, `ecosystems[${index}].pending_tasks`),
    0
  )
}

export function countPendingVotes(payload: unknown): number {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.proposals)) throw new Error('Invalid attention response: missing proposals envelope')
  return envelope.proposals.length
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.json()
}

async function fetchCorporationAttention(corporationId: number, account: string): Promise<CorporationAttention> {
  if (!VERANA_REST_ENDPOINT_PARTICIPANT || !VERANA_REST_ENDPOINT_GROUP) {
    throw new Error('Missing V4 participant or group endpoint')
  }
  const urls = attentionUrls(corporationId, account)
  const [tasks, votes] = await Promise.all([fetchJson(urls.pendingTasks), fetchJson(urls.pendingVotes)])
  return { pendingTasks: countPendingTasks(tasks), pendingVotes: countPendingVotes(votes) }
}

export async function fetchAttention(
  corporationIds: number[],
  account: string
): Promise<Record<number, CorporationAttention>> {
  const results = await Promise.allSettled(corporationIds.map((id) => fetchCorporationAttention(id, account)))
  const attention: Record<number, CorporationAttention> = {}
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') attention[corporationIds[index]] = result.value
    else logger.error('corporation attention', result.reason)
  })
  return attention
}
