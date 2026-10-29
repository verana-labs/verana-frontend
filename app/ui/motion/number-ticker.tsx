'use client'

import { animate, useReducedMotion } from 'framer-motion'
import { type ComponentPropsWithoutRef, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { EASE } from '@/ui/motion/tokens'

type NumberTickerProps = ComponentPropsWithoutRef<'span'> & {
  value: number
  format?: (value: number) => string
}

const DURATION_S = 0.8
const LOOKAHEAD_PX = 64

const defaultFormat = (value: number) => Math.round(value).toLocaleString()

function nearViewport(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight + LOOKAHEAD_PX
}

export function NumberTicker({ value, format = defaultFormat, className, ...props }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const target = useRef(value)
  const reduced = useReducedMotion()
  const [frame, setFrame] = useState<number | null>(null)

  target.current = value

  useLayoutEffect(() => {
    const node = ref.current
    if (reduced !== false || !node || nearViewport(node)) return
    let controls: ReturnType<typeof animate> | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        if (target.current === 0) return
        setFrame(0)
        controls = animate(0, target.current, {
          duration: DURATION_S,
          ease: EASE.emphasized,
          onUpdate: setFrame,
          onComplete: () => setFrame(null),
        })
      },
      { rootMargin: `0px 0px ${LOOKAHEAD_PX}px 0px` }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      controls?.stop()
      setFrame(null)
    }
  }, [reduced])

  return (
    <span className={cn('inline-block tabular-nums', className)} {...props}>
      <span ref={ref} aria-hidden="true">
        {format(frame ?? value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
