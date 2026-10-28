'use client'

import { animate, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { EASE } from '@/ui/motion/tokens'

const DURATION_S = 0.7

function onScreen(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight
}

export function CountUp({
  value,
  format,
  className,
}: {
  value: number
  format: (value: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const settled = useRef(false)
  const reduced = useReducedMotion()
  const [frame, setFrame] = useState<number | null>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (settled.current || reduced || value === 0 || !node) return
    if (!onScreen(node)) {
      settled.current = true
      return
    }
    setFrame(0)
    const controls = animate(0, value, {
      duration: DURATION_S,
      ease: EASE.emphasized,
      onUpdate: setFrame,
      onComplete: () => {
        settled.current = true
        setFrame(null)
      },
    })
    return () => {
      controls.stop()
      setFrame(null)
    }
  }, [value, reduced])

  return (
    <span className={cn('inline-block tabular-nums', className)}>
      <span ref={ref} aria-hidden="true">
        {format(frame ?? value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
