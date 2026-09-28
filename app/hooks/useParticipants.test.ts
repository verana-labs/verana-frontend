import { describe, expect, it, vi } from 'vitest'
import {
  fetchCorporationRoles,
  parseParticipantsResponse,
  participantsListUrl,
  participantsPageKey,
} from '@/hooks/useParticipants'

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

  it('maps a null payload to unresolved', () => {
    const row = parseParticipantsResponse({ participants: [{ ...participant, trust_data: null }] })[0]
    expect(row.trustData?.trustStatus).toBe('UNRESOLVED')
  })

  it('leaves the enrichment unset when the request asked for no trust_data', () => {
    expect(parseParticipantsResponse({ participants: [participant] })[0].trustData).toBeUndefined()
  })

  it('leaves the enrichment unset for a participant with no DID', () => {
    const row = parseParticipantsResponse({ participants: [{ ...participant, did: null, trust_data: null }] })[0]
    expect(row.trustData).toBeUndefined()
  })
})

describe('participantsListUrl', () => {
  it('asks the indexer for the ACTIVE validators with the claims their cards render', () => {
    expect(
      participantsListUrl('https://indexer/v4/participant', {
        schema: '9',
        role: 'ISSUER_GRANTOR',
        participantState: 'ACTIVE',
        trustData: 'full',
        pageSize: 25,
      })
    ).toBe(
      'https://indexer/v4/participant/list?schema_id=9&trust_data=full&limit=26&sort=%2Bid&role=ISSUER_GRANTOR&participant_state=ACTIVE'
    )
  })

  it('omits participant_state for a tree that shows every state', () => {
    const url = participantsListUrl('https://indexer/v4/participant', {
      schema: '9',
      role: 'ECOSYSTEM',
      trustData: 'full',
      pageSize: 25,
    })
    expect(url).not.toContain('participant_state')
    expect(url).toContain('trust_data=full')
  })

  it('keeps the state filter on the next cursor page', () => {
    expect(
      participantsListUrl('https://indexer/v4/participant', {
        schema: '9',
        role: 'ISSUER_GRANTOR',
        participantState: 'ACTIVE',
        trustData: 'full',
        pageSize: 25,
        after: '40',
      })
    ).toContain('min_id=41&role=ISSUER_GRANTOR&participant_state=ACTIVE')
  })
})

describe('participantsPageKey', () => {
  it('separates two sibling sets of the same schema', () => {
    const issuers = participantsPageKey({ schema: '9', role: 'ISSUER', validator: '4' })
    const verifiers = participantsPageKey({ schema: '9', role: 'VERIFIER', validator: '4' })
    expect(issuers).not.toBe(verifiers)
    expect(participantsPageKey({ schema: '9', role: 'ISSUER', validator: '7' })).not.toBe(issuers)
  })

  it('separates a cursor page from the first page of the same set', () => {
    expect(participantsPageKey({ schema: '9', role: 'ISSUER', validator: '4', after: '40' })).not.toBe(
      participantsPageKey({ schema: '9', role: 'ISSUER', validator: '4' })
    )
  })

  it('matches when the same page is requested twice', () => {
    expect(participantsPageKey({ schema: '9', role: 'ECOSYSTEM' })).toBe(
      participantsPageKey({ schema: '9', role: 'ECOSYSTEM', after: undefined })
    )
  })
})

describe('fetchCorporationRoles', () => {
  const row = (id: number, role: string) => ({ ...participant, id, role })
  const respond = (...pages: unknown[]) => {
    const queue = [...pages]
    return vi.fn(
      async (_input: RequestInfo | URL) => ({ ok: true, status: 200, json: async () => queue.shift() }) as Response
    )
  }

  it('asks for the active participants of the corporation in the ecosystem and keeps each role once', async () => {
    const fetchImpl = respond({ participants: [row(9, 'ISSUER'), row(8, 'HOLDER'), row(7, 'ISSUER')] })
    await expect(fetchCorporationRoles('https://indexer/v4/participant', 13, '44', fetchImpl)).resolves.toEqual([
      'ISSUER',
      'HOLDER',
    ])
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe('/v4/participant/list')
    expect(url.searchParams.get('corporation_id')).toBe('13')
    expect(url.searchParams.get('ecosystem_id')).toBe('44')
    expect(url.searchParams.get('participant_state')).toBe('ACTIVE')
    expect(url.searchParams.get('limit')).toBe('65')
  })

  it('follows the keyset cursor until the last page', async () => {
    const first = Array.from({ length: 65 }, (_, index) => row(200 - index, 'VERIFIER'))
    const fetchImpl = respond({ participants: first }, { participants: [row(3, 'ECOSYSTEM')] })
    await expect(fetchCorporationRoles('https://indexer/v4/participant', 13, '44', fetchImpl)).resolves.toEqual([
      'ECOSYSTEM',
      'VERIFIER',
    ])
    expect(new URL(String(fetchImpl.mock.calls[1]?.[0])).searchParams.get('max_id')).toBe('137')
  })

  it('fails with the indexer error', async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 502, json: async () => ({ error: 'down', code: 502 }) }) as Response
    )
    await expect(fetchCorporationRoles('https://indexer/v4/participant', 13, '44', fetchImpl)).rejects.toThrow(
      'Error 502: down'
    )
  })
})
