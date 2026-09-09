import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
  VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
  VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
  SESSION_LIFETIME_SECONDS: '3600',
}))

import {
  type CorporationMembership,
  chooseActingMembership,
  discoverCorporations,
  forgetActingCorporationId,
  invalidatesActingSession,
  loadActingCorporationId,
  mergeKnownMemberships,
  restoreActingMembership,
  saveActingCorporationId,
  sessionLifetimeMs,
} from '@/lib/corporation-discovery'

const AUTHORIZATIONS = 'https://indexer.example/v4/delegation/operator-authorizations'
const MEMBERSHIPS = 'https://indexer.example/v4/group/corporations-by-member'
const CORPORATION = 'https://indexer.example/v4/corporation/get/'
const STORAGE_KEY = 'verana.acting-corporation:verana1operator'

function corporationPayload(id: number) {
  return {
    corporation: { id, policy_address: `verana1policy${id}`, did: `did:web:corp${id}.example` },
  }
}

function stubFetch(routes: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const match = Object.entries(routes).find(([prefix]) => url.startsWith(prefix))
      if (!match) throw new Error(`Unexpected fetch: ${url}`)
      if (match[1] === null) return { ok: false, status: 502, json: async () => ({}) }
      return { ok: true, json: async () => match[1] }
    })
  )
}

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
  vi.useRealTimers()
})

describe('discoverCorporations', () => {
  it('unions grants per corporation with group memberships and their kinds', async () => {
    stubFetch({
      [AUTHORIZATIONS]: {
        authorizations: [
          { id: 1, corporation_id: 7, operator: 'verana1operator', msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] },
          { id: 2, corporation_id: 7, operator: 'verana1operator', msg_types: ['/verana.ec.v1.MsgUpdateEcosystem'] },
        ],
      },
      [MEMBERSHIPS]: {
        memberships: [
          { corporation_id: 7, weight: '2' },
          { corporation_id: 9, weight: '1' },
        ],
      },
      [`${CORPORATION}7`]: corporationPayload(7),
      [`${CORPORATION}9`]: corporationPayload(9),
    })

    expect(await discoverCorporations('verana1operator')).toEqual({
      memberships: [
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
      ],
      error: null,
    })
  })

  it('keeps the operator grants when the group source fails', async () => {
    stubFetch({
      [AUTHORIZATIONS]: {
        authorizations: [{ corporation_id: 7, msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] }],
      },
      [MEMBERSHIPS]: null,
      [`${CORPORATION}7`]: corporationPayload(7),
    })

    const discovered = await discoverCorporations('verana1operator')

    expect(discovered.memberships.map((entry) => [entry.corporation.id, entry.operator, entry.member])).toEqual([
      [7, true, false],
    ])
    expect(discovered.error).toBe('Unable to resolve corporation memberships: 502')
  })

  it('keeps the group memberships when the operator source fails', async () => {
    stubFetch({
      [AUTHORIZATIONS]: null,
      [MEMBERSHIPS]: { memberships: [{ corporation_id: 9, weight: '1' }] },
      [`${CORPORATION}9`]: corporationPayload(9),
    })

    const discovered = await discoverCorporations('verana1operator')

    expect(discovered.memberships.map((entry) => [entry.corporation.id, entry.operator, entry.member])).toEqual([
      [9, false, true],
    ])
    expect(discovered.error).toBe('Unable to resolve operator authorizations: 502')
  })

  it('drops only the corporation whose detail fetch fails', async () => {
    stubFetch({
      [AUTHORIZATIONS]: { authorizations: [] },
      [MEMBERSHIPS]: {
        memberships: [
          { corporation_id: 7, weight: '1' },
          { corporation_id: 9, weight: '1' },
        ],
      },
      [`${CORPORATION}7`]: null,
      [`${CORPORATION}9`]: corporationPayload(9),
    })

    const discovered = await discoverCorporations('verana1operator')

    expect(discovered.memberships.map((entry) => entry.corporation.id)).toEqual([9])
    expect(discovered.error).toBe('Unable to resolve corporation: 502')
  })
})

describe('chooseActingMembership', () => {
  it('picks the persisted corporation when it is still in the set', () => {
    expect(chooseActingMembership([membership(7), membership(9)], 9)?.corporation.id).toBe(9)
  })

  it('auto-selects a single candidate', () => {
    expect(chooseActingMembership([membership(7)], null)?.corporation.id).toBe(7)
  })

  it('defers with several candidates and nothing usable persisted', () => {
    expect(chooseActingMembership([membership(7), membership(9)], null)).toBeNull()
    expect(chooseActingMembership([membership(7), membership(9)], 4)).toBeNull()
  })
})

describe('mergeKnownMemberships', () => {
  it('keeps a known corporation that a partial discovery did not return', () => {
    const merged = mergeKnownMemberships([membership(7), membership(9)], [membership(9)])
    expect(merged.map((entry) => entry.corporation.id)).toEqual([7, 9])
  })

  it('prefers the freshly discovered entry over the known one', () => {
    const merged = mergeKnownMemberships([membership(7, { weight: '1' })], [membership(7, { weight: '5' })])
    expect(merged).toHaveLength(1)
    expect(merged[0].weight).toBe('5')
  })

  it('returns the discovered set when nothing is known', () => {
    expect(mergeKnownMemberships([], [membership(9), membership(7)]).map((entry) => entry.corporation.id)).toEqual([
      7, 9,
    ])
  })
})

describe('acting corporation persistence', () => {
  it('round-trips per address and ignores other addresses', () => {
    stubStorage()
    saveActingCorporationId('verana1operator', 7)
    expect(loadActingCorporationId('verana1operator')).toBe(7)
    expect(loadActingCorporationId('verana1other')).toBeNull()
  })

  it('expires after the configured session lifetime without sliding on load', () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const store = stubStorage()
    saveActingCorporationId('verana1operator', 7)
    expect(JSON.parse(store.get(STORAGE_KEY) ?? '')).toEqual({ corporationId: 7, expiresAt: 4_600_000 })

    vi.setSystemTime(4_599_999)
    expect(loadActingCorporationId('verana1operator')).toBe(7)
    expect(JSON.parse(store.get(STORAGE_KEY) ?? '').expiresAt).toBe(4_600_000)

    vi.setSystemTime(4_600_000)
    expect(loadActingCorporationId('verana1operator')).toBeNull()
    expect(store.has(STORAGE_KEY)).toBe(false)
  })

  it('falls back to one day when the lifetime is unset or invalid', () => {
    expect(sessionLifetimeMs('3600')).toBe(3_600_000)
    expect(sessionLifetimeMs(undefined)).toBe(86_400_000)
    expect(sessionLifetimeMs('later')).toBe(86_400_000)
    expect(sessionLifetimeMs('0')).toBe(86_400_000)
  })

  it('survives corrupted storage content', () => {
    stubStorage({ [STORAGE_KEY]: 'not json{' })
    expect(loadActingCorporationId('verana1operator')).toBeNull()
  })
})

describe('forgetActingCorporationId', () => {
  it('drops only the persisted selection of that address', () => {
    const store = stubStorage()
    saveActingCorporationId('verana1operator', 9)
    saveActingCorporationId('verana1other', 4)
    forgetActingCorporationId('verana1operator')
    expect(store.has(STORAGE_KEY)).toBe(false)
    expect(loadActingCorporationId('verana1other')).toBe(4)
  })
})

describe('invalidatesActingSession', () => {
  it('invalidates on an account switch', () => {
    expect(invalidatesActingSession('verana1operator', 'verana1other', false)).toBe(true)
  })

  it('invalidates on an explicit disconnect', () => {
    expect(invalidatesActingSession('verana1operator', undefined, true)).toBe(true)
  })

  it('keeps the session while the address is transiently lost', () => {
    expect(invalidatesActingSession('verana1operator', undefined, false)).toBe(false)
  })

  it('keeps the session while the same account stays connected', () => {
    expect(invalidatesActingSession('verana1operator', 'verana1operator', false)).toBe(false)
    expect(invalidatesActingSession('verana1operator', 'verana1operator', true)).toBe(false)
  })
})

describe('restoreActingMembership', () => {
  it('restores the persisted corporation when the account still acts for it', () => {
    stubStorage()
    saveActingCorporationId('verana1operator', 9)
    expect(restoreActingMembership('verana1operator', [membership(7), membership(9)])).toEqual({
      membership: membership(9),
      lost: false,
    })
  })

  it('reports a persisted corporation the account can no longer act for as lost', () => {
    const store = stubStorage()
    saveActingCorporationId('verana1operator', 4)
    expect(restoreActingMembership('verana1operator', [membership(7), membership(9)])).toEqual({
      membership: null,
      lost: true,
    })
    expect(store.has(STORAGE_KEY)).toBe(false)
  })

  it('never falls back to the sole survivor when the persisted corporation is gone', () => {
    stubStorage()
    saveActingCorporationId('verana1operator', 13)
    expect(restoreActingMembership('verana1operator', [membership(12)])).toEqual({ membership: null, lost: true })
    expect(loadActingCorporationId('verana1operator')).toBeNull()
  })

  it('persists a sole membership it auto-selects on first connect', () => {
    stubStorage()
    expect(restoreActingMembership('verana1operator', [membership(7)])).toEqual({
      membership: membership(7),
      lost: false,
    })
    expect(loadActingCorporationId('verana1operator')).toBe(7)
  })

  it('keeps the persisted choice and picks nothing when discovery was partial', () => {
    stubStorage()
    saveActingCorporationId('verana1operator', 4)
    expect(restoreActingMembership('verana1operator', [membership(9)], true)).toEqual({
      membership: null,
      lost: false,
    })
    expect(loadActingCorporationId('verana1operator')).toBe(4)
  })
})
