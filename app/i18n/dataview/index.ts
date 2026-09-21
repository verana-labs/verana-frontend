import { SESSION_LIFETIME_SECONDS } from '@/config/env'
import { sessionLifetimeMs } from '@/lib/corporation-discovery'
import { logger } from '@/lib/logger'
import type { Translator } from '@/ui/dataview/types'
import en from './en.json'
import es from './es.json'

type FlatDict = Record<string, string>
export type Locale = 'en' | 'es'
type TemplateValues = Record<string, string | number | boolean | null | undefined>

const DEFAULT_LOCALE: Locale = 'en'
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'es']

const dictionaries: Record<Locale, FlatDict> = {
  en: en as FlatDict,
  es: es as FlatDict,
}

function interpolate(template: string, values?: TemplateValues): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const value = values[k]
    if (value === undefined || value === null) return ''
    return String(value)
  })
}

export function getDictionary(locale: Locale = DEFAULT_LOCALE): FlatDict {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}

let currentLocale: Locale = DEFAULT_LOCALE
export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

// Resolve the start locale per [VFE-GEN-I18N-2]: stored choice, browser locale, same-language default, `en`.
export function resolveLocale(stored: unknown, browserLanguages: readonly string[]): Locale {
  if (isLocale(stored)) return stored
  for (const tag of browserLanguages) {
    const lower = tag.toLowerCase()
    if (isLocale(lower)) return lower
    const language = lower.split('-')[0]
    if (isLocale(language)) return language
  }
  return DEFAULT_LOCALE
}

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv'])

export function textDirection(locale: string): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.has(locale.toLowerCase().split('-')[0]) ? 'rtl' : 'ltr'
}

const LOCALE_STORAGE_KEY = 'verana.locale'

interface StoredLocale {
  locale: Locale
  expiresAt: number
}

export function loadStoredLocale(): Locale | null {
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (!raw) return null
    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return null
    const { locale, expiresAt } = stored as Partial<StoredLocale>
    if (!isLocale(locale) || typeof expiresAt !== 'number') return null
    if (expiresAt <= Date.now()) {
      window.localStorage.removeItem(LOCALE_STORAGE_KEY)
      return null
    }
    return locale
  } catch {
    return null
  }
}

export function saveLocale(locale: Locale): void {
  const stored: StoredLocale = { locale, expiresAt: Date.now() + sessionLifetimeMs(SESSION_LIFETIME_SECONDS) }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(stored))
  } catch (reason) {
    logger.warn('locale storage', reason)
  }
}

export function forgetLocale(): void {
  try {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
  } catch (reason) {
    logger.warn('locale storage', reason)
  }
}

export function translateWithLocale(key: string, locale: Locale = DEFAULT_LOCALE, values?: TemplateValues): string {
  const dict = getDictionary(locale)
  const template = dict[key] ?? getDictionary(DEFAULT_LOCALE)[key] ?? key
  return interpolate(template, values)
}

export function formatDictionaryValue(template: string, values?: TemplateValues): string {
  return interpolate(template, values)
}

export const translate: Translator = (key, values) => {
  const dict = getDictionary(currentLocale)
  const template = dict[key] ?? getDictionary(DEFAULT_LOCALE)[key] ?? key
  return interpolate(template, values)
}
