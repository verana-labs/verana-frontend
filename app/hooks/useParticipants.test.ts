import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCorporationParticipants, parseParticipantsResponse, participantsPageKey } from '@/hooks/useParticipants'

const participant = {
  id: 1,
  schema_id: 1,
  role: 'ECOSYSTEM',
  did: 'did:web:participant.example',
  corporation_id: 1,
  participant_state: 'ACTIVE',
  corporation_available_actions: ['SetParticipantEffectiveUntil'],
  validator_available_actions: [],
}

describe('parseParticipantsResponse', () => {
  it('requires the V4 participants envelope', () => {
    expect(parseParticipantsResponse({ participants: [participant] })).toHaveLength(1)
    expect(() => parseParticipantsResponse({ permissions: [participant] })).toThrow('participants envelope')
  })
})

const trustData = {
  did: 'did:web:participant.example',
  trusted: true,
  expiresAtTime: null,
  ecsCredentials: [{ ecsSchema: 'ServiceCredential', credentialSubject: { name: 'Acme Verifier' } }],
}

describe('participant rows carry the inline trust_data', () => {
  it('maps a full payload to the row enrichment', () => {
    const row = parseParticipantsResponse({ participants: [{ ...participant, trust_data: trustData }] })[0]
    expect(row.trustData?.trustStatus).toBe('TRUSTED')
    expect(row.trustData?.serviceName).toBe('Acme Verifier')
  })
})

describe('participantsPageKey', () => {
  it('separates two sibling sets of the same schema', () => {
    const issuers = participantsPageKey({ schema: '9', role: 'ISSUER', validator: '4' })
    const verifiers = participantsPageKey({ schema: '9', role: 'VERIFIER', validator: '4' })
    expect(issuers).not.toBe(verifiers)
    expect(participantsPageKey({ schema: '9', role: 'ISSUER', validator: '7' })).not.toBe(issuers)
  })
})

describe('fetchCorporationParticipants', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const row = (id: number, ecosystemId: number) => ({ ...participant, id, ecosystem_id: ecosystemId, role: 'ISSUER' })

  function stubPages(...pages: Array<{ status: number; rows: unknown[] }>) {
    const urls: URL[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (requested: string) => {
        urls.push(new URL(requested))
        const { status, rows } = pages[urls.length - 1] ?? { status: 200, rows: [] }
        return { ok: status === 200, status, json: async () => ({ participants: rows }) }
      })
    )
    return urls
  }

  it('asks once for the active participants of the corporation across every ecosystem', async () => {
    const urls = stubPages({ status: 200, rows: [row(9, 44), row(8, 45)] })
    const { participants, failureReason } = await fetchCorporationParticipants('https://indexer/v4/participant', 13)
    expect(participants.map((entry) => entry.ecosystem_id)).toEqual([44, 45])
    expect(failureReason).toBeNull()
    expect(urls).toHaveLength(1)
    expect(urls[0]?.pathname).toBe('/v4/participant/list')
    expect(urls[0]?.searchParams.get('corporation_id')).toBe('13')
    expect(urls[0]?.searchParams.get('participant_state')).toBe('ACTIVE')
    expect(urls[0]?.searchParams.has('ecosystem_id')).toBe(false)
    expect(urls[0]?.searchParams.get('limit')).toBe('65')
  })

  it('follows the keyset cursor until the last page', async () => {
    const first = Array.from({ length: 65 }, (_, index) => row(200 - index, 44))
    const urls = stubPages({ status: 200, rows: first }, { status: 200, rows: [row(3, 46)] })
    const { participants } = await fetchCorporationParticipants('https://indexer/v4/participant', 13)
    expect(participants).toHaveLength(65)
    expect(urls[1]?.searchParams.get('max_id')).toBe('137')
  })

  it('keeps the participants already loaded when a later page fails', async () => {
    const first = Array.from({ length: 65 }, (_, index) => row(200 - index, 44))
    stubPages({ status: 200, rows: first }, { status: 502, rows: [] })
    const { participants, failureReason } = await fetchCorporationParticipants('https://indexer/v4/participant', 13)
    expect(participants).toHaveLength(64)
    expect(failureReason).toBe('Unable to fetch participants: 502')
  })
})
