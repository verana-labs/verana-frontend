import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({ SESSION_LIFETIME_SECONDS: '3600' }))

import { forgetListFilters, loadListFilters, saveListFilters } from '@/lib/list-filters'

const DEFAULTS = { search: '', showArchived: false, order: 'newest' }
const ALICE = 'verana1alice'
const BOB = 'verana1bob'

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

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('list filters', () => {
  it('restores the filters an account saved for a list within the session lifetime', () => {
    stubStorage()
    saveListFilters('discover', ALICE, { search: 'ecs', showArchived: true, order: 'trustValue' })
    expect(loadListFilters('discover', ALICE, DEFAULTS)).toEqual({
      search: 'ecs',
      showArchived: true,
      order: 'trustValue',
    })
    expect(loadListFilters('ecosystems', ALICE, DEFAULTS)).toBeNull()
  })

  it('never hands one account the filters of another', () => {
    stubStorage()
    saveListFilters('discover', ALICE, { search: 'ecs', showArchived: true, order: 'trustValue' })
    expect(loadListFilters('discover', BOB, DEFAULTS)).toBeNull()
  })

  it('drops the filters once the session lifetime has passed', () => {
    vi.useFakeTimers()
    const store = stubStorage()
    saveListFilters('agents', ALICE, { search: 'x', showArchived: true, order: 'newest' })
    vi.advanceTimersByTime(3600 * 1000 + 1)
    expect(loadListFilters('agents', ALICE, DEFAULTS)).toBeNull()
    expect(store.size).toBe(0)
  })

  it('keeps the defaults for a field that is missing or has the wrong type, and ignores unknown fields', () => {
    stubStorage({
      [`verana.list-filters:discover:${ALICE}`]: JSON.stringify({
        filters: { search: 42, showArchived: true, removed: 'x' },
        expiresAt: Date.now() + 1000,
      }),
    })
    expect(loadListFilters('discover', ALICE, DEFAULTS)).toEqual({ search: '', showArchived: true, order: 'newest' })
  })

  it('keeps the default order when the saved one is not a known order', () => {
    stubStorage({
      [`verana.list-filters:discover:${ALICE}`]: JSON.stringify({
        filters: { search: 'ecs', showArchived: false, order: 'oldest' },
        expiresAt: Date.now() + 1000,
      }),
    })
    expect(loadListFilters('discover', ALICE, DEFAULTS)).toEqual({
      search: 'ecs',
      showArchived: false,
      order: 'newest',
    })
  })

  it('reads a corrupt entry as nothing saved', () => {
    stubStorage({ [`verana.list-filters:discover:${ALICE}`]: '{not json' })
    expect(loadListFilters('discover', ALICE, DEFAULTS)).toBeNull()
  })

  it("forgets every list of the account that disconnected or switched away, and only that account's", () => {
    const store = stubStorage()
    for (const scope of ['discover', 'ecosystems', 'agents'] as const) saveListFilters(scope, ALICE, DEFAULTS)
    saveListFilters('discover', BOB, DEFAULTS)
    forgetListFilters(ALICE)
    expect([...store.keys()]).toEqual([`verana.list-filters:discover:${BOB}`])
  })
})
