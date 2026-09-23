import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  SESSION_LIFETIME_SECONDS: '3600',
}))

import { forgetLocale, loadStoredLocale, resolveLocale, saveLocale, textDirection } from '@/i18n/dataview'

const STORAGE_KEY = 'verana.locale'

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

describe('resolveLocale', () => {
  it('follows the order of VFE-GEN-I18N-2: stored choice, browser locale, same-language default, en', () => {
    expect(resolveLocale('es', ['en-US'])).toBe('es')
    expect(resolveLocale(null, ['es', 'en-US'])).toBe('es')
    expect(resolveLocale(null, ['es-MX', 'en-US'])).toBe('es')
    expect(resolveLocale(null, ['fr-FR', 'es-AR'])).toBe('es')
    expect(resolveLocale(null, ['fr-FR', 'de'])).toBe('en')
    expect(resolveLocale(null, [])).toBe('en')
  })

  it('ignores a stored value that is not a supported locale', () => {
    expect(resolveLocale('fr', ['es'])).toBe('es')
    expect(resolveLocale({ locale: 'es' }, ['en'])).toBe('en')
  })
})

describe('stored locale', () => {
  it('expires after the session lifetime of VFE-WALLET-4 and can be forgotten', () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const store = stubStorage()
    saveLocale('es')
    expect(JSON.parse(store.get(STORAGE_KEY) ?? '')).toEqual({ locale: 'es', expiresAt: 4_600_000 })

    vi.setSystemTime(4_599_999)
    expect(loadStoredLocale()).toBe('es')

    vi.setSystemTime(4_600_000)
    expect(loadStoredLocale()).toBeNull()
    expect(store.has(STORAGE_KEY)).toBe(false)

    saveLocale('es')
    forgetLocale()
    expect(loadStoredLocale()).toBeNull()
  })

  it('survives corrupted or foreign storage content', () => {
    stubStorage({ [STORAGE_KEY]: 'not json{' })
    expect(loadStoredLocale()).toBeNull()
    stubStorage({ [STORAGE_KEY]: JSON.stringify({ locale: 'fr', expiresAt: Number.MAX_SAFE_INTEGER }) })
    expect(loadStoredLocale()).toBeNull()
  })
})

describe('textDirection', () => {
  it('returns rtl only for right-to-left languages, whatever the region', () => {
    expect(textDirection('ar-SA')).toBe('rtl')
    expect(textDirection('he')).toBe('rtl')
    expect(textDirection('es-MX')).toBe('ltr')
    expect(textDirection('en')).toBe('ltr')
  })
})
