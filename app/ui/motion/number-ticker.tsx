'use client'

import { useInView, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { type ComponentPropsWithoutRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type NumberTickerProps = ComponentPropsWithoutRef<'span'> & {
  value: number
  delay?: number
  format?: (value: number) => string
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString()

export function NumberTicker({ value, delay = 0, format = defaultFormat, className, ...props }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const played = useRef(false)
  const reduced = useReducedMotion()
  const inView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { visualDuration: 1.2, bounce: 0 })

  useEffect(() => {
    if (reduced || !inView || (!played.current && value === 0)) return
    if (played.current) {
      spring.jump(value)
      return
    }
    played.current = true
    const timer = setTimeout(() => motionValue.set(value), delay * 1000)
    return () => clearTimeout(timer)
  }, [reduced, inView, value, delay, motionValue, spring])

  useEffect(
    () =>
      spring.on('change', (latest) => {
        if (ref.current) ref.current.textContent = format(latest)
      }),
    [spring, format]
  )

  return (
    <span className={cn('inline-block tabular-nums', className)} {...props}>
      <span ref={ref} aria-hidden="true">
        {format(reduced ? value : 0)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
