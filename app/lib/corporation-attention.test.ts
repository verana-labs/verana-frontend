import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
  VERANA_REST_ENDPOINT_PARTICIPANT: 'https://indexer.example/v4/participant',
}))

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))

import { attentionUrls, countPendingTasks, countPendingVotes, fetchAttention } from '@/lib/corporation-attention'

const pendingFlat = {
  ecosystems: [
    {
      id: 1,
      did: 'did:web:eco1.example',
      pending_tasks: 2,
      participants: 3,
      schemas: [{ id: 10, title: 'Schema', description: null, pending_tasks: 2, pending_participants: [] }],
    },
    { id: 2, did: null, pending_tasks: 1, participants: 1, schemas: [] },
  ],
}

const proposals = { proposals: [{ id: 1 }, { id: 2 }] }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('attentionUrls', () => {
  it('scopes both queries to the corporation and the voting account', () => {
    expect(attentionUrls(7, 'verana1member')).toEqual({
      pendingTasks: 'https://indexer.example/v4/participant/pending/flat?corporation_id=7&limit=1024',
      pendingVotes:
        'https://indexer.example/v4/group/proposals?corporation_id=7&pending_voter=verana1member&limit=1024',
    })
  })
})

describe('countPendingTasks', () => {
  it('sums the pending tasks of every ecosystem', () => {
    expect(countPendingTasks(pendingFlat)).toBe(3)
  })

  it('rejects a payload without the ecosystems envelope', () => {
    expect(() => countPendingTasks({})).toThrow('ecosystems')
  })
})

describe('countPendingVotes', () => {
  it('counts the proposals awaiting the vote', () => {
    expect(countPendingVotes(proposals)).toBe(2)
  })

  it('rejects a payload without the proposals envelope', () => {
    expect(() => countPendingVotes({})).toThrow('proposals')
  })
})

describe('fetchAttention', () => {
  it('drops only the corporation whose counts fail to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('corporation_id=9')) return { ok: false, status: 502, json: async () => ({}) }
        return { ok: true, json: async () => (url.includes('/proposals') ? proposals : pendingFlat) }
      })
    )

    expect(await fetchAttention([7, 9], 'verana1member')).toEqual({ 7: { pendingTasks: 3, pendingVotes: 2 } })
  })
})
