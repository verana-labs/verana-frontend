'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ToggleTheme() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <label htmlFor="theme-switch" className='toggle-container'>
      <div className="relative">
        {/* Input hidden */}
        <input
          id="theme-switch"
          type="checkbox"
          className="sr-only peer"
          checked={isDark}
          onChange={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
        />

        {/* Track */}
        <div className='toggle-track' />

        {/* Thumb icon */}
        <div className={`toggle-thumb-icon`} >
          {isDark
            ? <Moon className="icon-xs" />
            : <Sun  className="icon-xs" />
          }
        </div>
      </div>
    </label>
  )
}
