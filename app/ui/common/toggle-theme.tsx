'use client'

import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { translate } from '@/i18n/dataview'
import { usePreferences } from '@/providers/preferences-provider'

export function ToggleTheme() {
  const { resolvedTheme, setTheme } = usePreferences()
  const isDark = resolvedTheme === 'dark'
  const title = translate('navbar.theme.title')

  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="navbar-icon"
      title={title}
      aria-label={title}
      aria-pressed={isDark}
    >
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
    </button>
  )
}
