import { describe, expect, it } from 'vitest'
import { isRtl, parsePreferences, resolveLocale } from '@/lib/preferences'

const SUPPORTED = ['en', 'es'] as const
const DEFAULTS = { locale: null, theme: 'system' }

describe('resolveLocale', () => {
  it('prefers the selected locale over the browser', () => {
    expect(resolveLocale('es', ['en-US'], SUPPORTED)).toBe('es')
  })

  it('maps a selected regional variant onto its language', () => {
    expect(resolveLocale('es-MX', [], SUPPORTED)).toBe('es')
    expect(resolveLocale('EN-gb', [], SUPPORTED)).toBe('en')
  })

  it('walks the browser locales in order, matching by language', () => {
    expect(resolveLocale(null, ['fr-FR', 'es-MX', 'en'], SUPPORTED)).toBe('es')
    expect(resolveLocale(undefined, ['en-US', 'es'], SUPPORTED)).toBe('en')
  })

  it('skips an unsupported selection and keeps walking the chain', () => {
    expect(resolveLocale('fr', ['es-AR'], SUPPORTED)).toBe('es')
  })

  it('defaults to en when nothing matches', () => {
    expect(resolveLocale('fr', ['de-DE', 'ja'], SUPPORTED)).toBe('en')
    expect(resolveLocale(null, [], SUPPORTED)).toBe('en')
    expect(resolveLocale('', [''], SUPPORTED)).toBe('en')
  })
})

describe('isRtl', () => {
  it('flags right-to-left scripts, with or without region and script subtags', () => {
    for (const locale of ['ar', 'he-IL', 'fa', 'ur-PK', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'az-Arab']) {
      expect(isRtl(locale), locale).toBe(true)
    }
  })

  it('keeps left-to-right locales and invalid tags ltr', () => {
    for (const locale of ['en', 'es-MX', 'ar-Latn', 'ja', '', 'not a tag']) {
      expect(isRtl(locale), locale).toBe(false)
    }
  })
})

describe('parsePreferences', () => {
  it('returns the defaults for missing or broken storage', () => {
    expect(parsePreferences(null)).toEqual(DEFAULTS)
    expect(parsePreferences('')).toEqual(DEFAULTS)
    expect(parsePreferences('{')).toEqual(DEFAULTS)
    expect(parsePreferences('42')).toEqual(DEFAULTS)
    expect(parsePreferences('null')).toEqual(DEFAULTS)
  })

  it('keeps valid values and drops the rest', () => {
    expect(parsePreferences('{"locale":"es","theme":"dark"}')).toEqual({ locale: 'es', theme: 'dark' })
    expect(parsePreferences('{"locale":"","theme":"blue"}')).toEqual(DEFAULTS)
    expect(parsePreferences('{"locale":7,"theme":"light"}')).toEqual({ locale: null, theme: 'light' })
  })

  it('hands back a fresh object each time', () => {
    expect(parsePreferences(null)).not.toBe(parsePreferences(null))
  })
})
