'use client'

import { useTheme } from 'next-themes'
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { type Locale, SUPPORTED_LOCALES, setLocale } from '@/i18n/dataview'
import {
  isRtl,
  loadPreferences,
  type Preferences,
  resolveLocale,
  savePreferences,
  type ThemePreference,
} from '@/lib/preferences'

export interface PreferencesContextValue {
  locale: Locale
  theme: ThemePreference
  resolvedTheme: 'light' | 'dark'
  setLocale: (locale: Locale) => void
  setTheme: (theme: ThemePreference) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function browserLocales(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages ?? [navigator.language]
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme: applyTheme } = useTheme()
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const locale = useMemo(
    () => resolveLocale(preferences.locale, browserLocales(), SUPPORTED_LOCALES),
    [preferences.locale]
  )
  setLocale(locale)

  useEffect(() => {
    applyTheme(preferences.theme)
  }, [preferences.theme, applyTheme])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'
  }, [locale])

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      const next = { ...preferences, ...patch }
      savePreferences(next)
      setPreferences(next)
    },
    [preferences]
  )

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      theme: preferences.theme,
      resolvedTheme: resolvedTheme === 'dark' ? 'dark' : 'light',
      setLocale: (next) => update({ locale: next }),
      setTheme: (next) => update({ theme: next }),
    }),
    [locale, preferences.theme, resolvedTheme, update]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function LocaleBoundary({ children }: { children: React.ReactNode }) {
  const { locale } = usePreferences()
  return <Fragment key={locale}>{children}</Fragment>
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences requires a PreferencesProvider')
  return context
}
