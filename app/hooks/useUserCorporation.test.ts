import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
  VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
  VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
  SESSION_LIFETIME_SECONDS: '86400',
  VERANA_OPERATOR_ONLY: undefined,
}))

import {
  type CorporationMembership,
  chooseActingMembership,
  discoverCorporations,
  findCorporationMembership,
  loadActingCorporationId,
  saveActingCorporationId,
} from '@/lib/corporation-discovery'

function corporationPayload(id: number) {
  return {
    corporation: { id, policy_address: `verana1policy${id}`, did: `did:web:corp${id}.example` },
  }
}

function stubFetch(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const match = Object.entries(routes).find(([prefix]) => url.startsWith(prefix))
    if (!match) throw new Error(`Unexpected fetch: ${url}`)
    return { ok: true, json: async () => match[1] }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function membership(id: number, overrides: Partial<CorporationMembership> = {}): CorporationMembership {
  return {
    corporation: { id, policyAddress: `verana1policy${id}`, did: `did:web:corp${id}.example` },
    operator: true,
    member: false,
    weight: null,
    grantedMessageTypes: ['/verana.ec.v1.MsgCreateEcosystem'],
    ...overrides,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('discoverCorporations', () => {
  it('unions grants per corporation with group memberships and their kinds', async () => {
    stubFetch({
      'https://indexer.example/v4/delegation/operator-authorizations': {
        authorizations: [
          { id: 1, corporation_id: 7, operator: 'verana1operator', msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] },
          { id: 2, corporation_id: 7, operator: 'verana1operator', msg_types: ['/verana.ec.v1.MsgUpdateEcosystem'] },
        ],
      },
      'https://indexer.example/v4/group/corporations-by-member': {
        memberships: [
          { corporation_id: 7, weight: '2' },
          { corporation_id: 9, weight: '1' },
        ],
      },
      'https://indexer.example/v4/corporation/get/7': corporationPayload(7),
      'https://indexer.example/v4/corporation/get/9': corporationPayload(9),
    })

    const discovered = await discoverCorporations('verana1operator')

    expect(discovered).toEqual([
      {
        corporation: { id: 7, policyAddress: 'verana1policy7', did: 'did:web:corp7.example' },
        operator: true,
        member: true,
        weight: '2',
        grantedMessageTypes: ['/verana.ec.v1.MsgCreateEcosystem', '/verana.ec.v1.MsgUpdateEcosystem'],
      },
      {
        corporation: { id: 9, policyAddress: 'verana1policy9', did: 'did:web:corp9.example' },
        operator: false,
        member: true,
        weight: '1',
        grantedMessageTypes: [],
      },
    ])
  })

  it('skips the group source in operator-only mode', async () => {
    vi.resetModules()
    vi.doMock('@/config/env', () => ({
      VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
      VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
      VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
      SESSION_LIFETIME_SECONDS: '86400',
      VERANA_OPERATOR_ONLY: 'true',
    }))
    const isolated = await import('@/lib/corporation-discovery')
    const fetchMock = stubFetch({
      'https://indexer.example/v4/delegation/operator-authorizations': {
        authorizations: [
          { id: 1, corporation_id: 7, operator: 'verana1operator', msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] },
        ],
      },
      'https://indexer.example/v4/corporation/get/7': corporationPayload(7),
    })

    const discovered = await isolated.discoverCorporations('verana1operator')

    expect(discovered).toHaveLength(1)
    expect(discovered[0].member).toBe(false)
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('/group/'))).toBe(true)
    vi.doUnmock('@/config/env')
    vi.resetModules()
  })
})

describe('chooseActingMembership', () => {
  it('prefers a persisted corporation still in the set', () => {
    const memberships = [membership(7), membership(9)]
    expect(chooseActingMembership(memberships, 9)?.corporation.id).toBe(9)
  })

  it('auto-selects a single candidate and defers when several and nothing persisted', () => {
    expect(chooseActingMembership([membership(7)], null)?.corporation.id).toBe(7)
    expect(chooseActingMembership([membership(7), membership(9)], null)).toBeNull()
    expect(chooseActingMembership([membership(7), membership(9)], 4)).toBeNull()
  })
})

describe('acting persistence', () => {
  it('round-trips per address and ignores other addresses', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      },
    })

    saveActingCorporationId('verana1operator', 7)
    expect(loadActingCorporationId('verana1operator')).toBe(7)
    expect(loadActingCorporationId('verana1other')).toBeNull()
  })
})

describe('acting persistence edge cases', () => {
  function stubStorage(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial))
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      },
    })
    return store
  }

  it('ignores an expired persisted selection', () => {
    stubStorage({
      'verana.acting-corporation': JSON.stringify({
        address: 'verana1operator',
        corporationId: 7,
        expiresAt: Date.now() - 1000,
      }),
    })
    expect(loadActingCorporationId('verana1operator')).toBeNull()
  })

  it('survives corrupted storage content', () => {
    stubStorage({ 'verana.acting-corporation': 'not json{' })
    expect(loadActingCorporationId('verana1operator')).toBeNull()
  })
})

describe('findCorporationMembership', () => {
  it('returns the membership of the requested corporation only', async () => {
    stubFetch({
      'https://indexer.example/v4/delegation/operator-authorizations': {
        authorizations: [
          { id: 1, corporation_id: 9, operator: 'verana1operator', msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] },
        ],
      },
      'https://indexer.example/v4/group/corporations-by-member': {
        memberships: [{ corporation_id: 7, weight: '1' }],
      },
      'https://indexer.example/v4/corporation/get/7': corporationPayload(7),
      'https://indexer.example/v4/corporation/get/9': corporationPayload(9),
    })

    const operator = await findCorporationMembership('verana1operator', 9)
    const member = await findCorporationMembership('verana1operator', 7)

    expect(operator?.corporation.id).toBe(9)
    expect(operator?.grantedMessageTypes).toEqual(['/verana.ec.v1.MsgCreateEcosystem'])
    expect(member?.grantedMessageTypes).toEqual([])
    expect(await findCorporationMembership('verana1operator', 8)).toBeNull()
  })

  it('returns null when the account has no membership at all', async () => {
    stubFetch({
      'https://indexer.example/v4/delegation/operator-authorizations': { authorizations: [] },
      'https://indexer.example/v4/group/corporations-by-member': { memberships: [] },
    })

    expect(await findCorporationMembership('verana1operator', 9)).toBeNull()
  })

  it('propagates a discovery failure instead of returning null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }))
    )
    await expect(findCorporationMembership('verana1operator', 9)).rejects.toThrow('502')
  })
})
