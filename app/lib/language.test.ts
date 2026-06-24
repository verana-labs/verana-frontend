import { describe, expect, it } from 'vitest'
import { canonicalizeLanguageTag, getLanguageLabel } from '@/lib/language'

describe('canonicalizeLanguageTag', () => {
  it('returns an already-canonical tag unchanged', () => {
    expect(canonicalizeLanguageTag('en')).toBe('en')
    expect(canonicalizeLanguageTag('en-US')).toBe('en-US')
    expect(canonicalizeLanguageTag('fr-FR')).toBe('fr-FR')
  })

  it('lowercases the language subtag', () => {
    expect(canonicalizeLanguageTag('EN')).toBe('en')
    expect(canonicalizeLanguageTag('FR')).toBe('fr')
  })

  it('uppercases the region subtag', () => {
    expect(canonicalizeLanguageTag('en-us')).toBe('en-US')
    expect(canonicalizeLanguageTag('EN-us')).toBe('en-US')
  })

  it('title-cases the script subtag', () => {
    expect(canonicalizeLanguageTag('zh-hant')).toBe('zh-Hant')
    expect(canonicalizeLanguageTag('zh-hant-cn')).toBe('zh-Hant-CN')
  })

  it('preserves an empty string without throwing', () => {
    expect(canonicalizeLanguageTag('')).toBe('')
  })

  it('returns malformed tags unchanged instead of throwing', () => {
    expect(canonicalizeLanguageTag('not a tag')).toBe('not a tag')
    expect(canonicalizeLanguageTag('de_DE')).toBe('de_DE')
    expect(canonicalizeLanguageTag('x-foo')).toBe('x-foo')
  })

  it('is idempotent on its own output', () => {
    for (const tag of ['en', 'EN', 'en-us', 'zh-hant-cn', 'fr-FR']) {
      const once = canonicalizeLanguageTag(tag)
      expect(canonicalizeLanguageTag(once)).toBe(once)
    }
  })
})

describe('getLanguageLabel', () => {
  const state = (entries: Array<[string, string]>, loadFailed = false) => ({
    labelByValue: new Map(entries),
    loadFailed,
  })

  it('returns an empty string for missing or empty values', () => {
    const s = state([['en', 'English']])
    expect(getLanguageLabel(s, undefined)).toBe('')
    expect(getLanguageLabel(s, '')).toBe('')
  })

  it('returns the label on an exact key match', () => {
    const s = state([
      ['en', 'English'],
      ['fr-FR', 'French (France)'],
    ])
    expect(getLanguageLabel(s, 'en')).toBe('English')
    expect(getLanguageLabel(s, 'fr-FR')).toBe('French (France)')
  })

  it('falls back to the canonicalized tag when the raw value misses', () => {
    const s = state([['en-US', 'English (US)']])
    expect(getLanguageLabel(s, 'en-us')).toBe('English (US)')
    expect(getLanguageLabel(s, 'EN-US')).toBe('English (US)')
  })

  it('prefers the exact match over the canonicalized one', () => {
    const s = state([
      ['en-us', 'raw lowercase entry'],
      ['en-US', 'canonical entry'],
    ])
    expect(getLanguageLabel(s, 'en-us')).toBe('raw lowercase entry')
  })

  it('returns an empty label for an empty-string entry rather than degrading', () => {
    const s = state([['en', '']], true)
    expect(getLanguageLabel(s, 'en')).toBe('')
  })

  it('returns an empty string for an unknown tag while options are still loading', () => {
    const s = state([['en', 'English']], false)
    expect(getLanguageLabel(s, 'zz')).toBe('')
  })

  it('echoes the raw value for an unknown tag once loading has failed', () => {
    const s = state([['en', 'English']], true)
    expect(getLanguageLabel(s, 'zz')).toBe('zz')
    expect(getLanguageLabel(s, 'de_DE')).toBe('de_DE')
  })
})
