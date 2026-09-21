'use client'

import { faMoon } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

export default function ToggleTheme() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'
  const label = resolveTranslatable({ key: isDark ? 'navbar.theme.toLight' : 'navbar.theme.toDark' }, translate)

  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={label}
      aria-label={label}
      className="navbar-icon"
    >
      <FontAwesomeIcon icon={faMoon} className={isDark ? 'text-primary-400' : undefined} />
    </button>
  )
}
