'use client'

import { useReducedMotion } from 'framer-motion'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRef } from 'react'
import { flushSync } from 'react-dom'
import { translate } from '@/i18n/dataview'
import { Button } from '@/ui/shadcn/button'

const DURATION_MS = 400

const VIEW_TRANSITION_CSS =
  '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const reduceMotion = useReducedMotion()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isDark = resolvedTheme === 'dark'
  const label = translate(isDark ? 'navbar.theme.toLight' : 'navbar.theme.toDark')

  const toggle = async () => {
    const next = isDark ? 'light' : 'dark'
    const button = buttonRef.current
    if (reduceMotion || !button || typeof document.startViewTransition !== 'function') {
      setTheme(next)
      return
    }
    const transition = document.startViewTransition(() => flushSync(() => setTheme(next)))
    await transition.ready
    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: DURATION_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
    )
  }

  return (
    <>
      <style href="verana-theme-toggle" precedence="default">
        {VIEW_TRANSITION_CSS}
      </style>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        onClick={() => void toggle()}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </Button>
    </>
  )
}
