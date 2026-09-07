export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']

export interface Preferences {
  locale: string | null
  theme: ThemePreference
}

export const PREFERENCES_STORAGE_KEY = 'verana.preferences'

const DEFAULT_PREFERENCES: Preferences = { locale: null, theme: 'system' }

const RTL_SCRIPTS = new Set(['Arab', 'Hebr', 'Thaa', 'Syrc', 'Nkoo', 'Adlm', 'Rohg', 'Samr', 'Mand'])

function languageOf(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0]
}

function matchLocale<L extends string>(candidate: string, supported: readonly L[]): L | undefined {
  const wanted = candidate.toLowerCase()
  const exact = supported.find((locale) => locale.toLowerCase() === wanted)
  if (exact) return exact
  const language = languageOf(wanted)
  return supported.find((locale) => languageOf(locale) === language)
}

export function resolveLocale<L extends string>(
  selected: string | null | undefined,
  browserLocales: readonly string[],
  supported: readonly L[]
): L | 'en' {
  for (const candidate of [selected, ...browserLocales]) {
    if (!candidate) continue
    const match = matchLocale(candidate, supported)
    if (match) return match
  }
  return 'en'
}

export function isRtl(locale: string): boolean {
  try {
    return RTL_SCRIPTS.has(new Intl.Locale(locale).maximize().script ?? '')
  } catch {
    return false
  }
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some((theme) => theme === value)
}

export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return { ...DEFAULT_PREFERENCES }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFERENCES }
    const locale = 'locale' in parsed ? parsed.locale : null
    const theme = 'theme' in parsed ? parsed.theme : null
    return {
      locale: typeof locale === 'string' && locale.length > 0 ? locale : null,
      theme: isThemePreference(theme) ? theme : DEFAULT_PREFERENCES.theme,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function loadPreferences(): Preferences {
  try {
    return parsePreferences(window.localStorage.getItem(PREFERENCES_STORAGE_KEY))
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {}
}
