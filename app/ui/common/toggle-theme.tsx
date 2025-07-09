'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ToggleTheme() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitamos mismatch SSR/cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <label htmlFor="theme-switch" className="inline-flex items-center cursor-pointer">
      <div className="relative">
        {/* Input oculto */}
        <input
          id="theme-switch"
          type="checkbox"
          className="sr-only peer"
          checked={isDark}
          onChange={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
        />

        {/* Track */}
        <div className="w-12 h-6 bg-content-light-bg dark:bg-content-dark-bg rounded-full transition-colors" />

        {/* Thumb con icono */}
        <div
          className={`
            absolute top-0.5 left-0.5
            w-5 h-5
            bg-white
            border
            border-transparent
            rounded-full
            flex items-center justify-center
            transition-transform
            peer-checked:translate-x-6
            peer-checked:bg-gray-700
            peer-checked:border-transparent
          `}
        >
          {isDark
            ? <Moon className="h-4 w-4" />
            : <Sun  className="h-4 w-4" />
          }
        </div>
      </div>
    </label>
  )
}
