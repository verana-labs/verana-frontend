'use client'

import { type HTMLMotionProps, motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { DURATION, EASE } from '@/ui/motion/tokens'

type BlurFadeProps = HTMLMotionProps<'div'> & {
  delay?: number
  offset?: number
  blur?: string
  inView?: boolean
}

export function BlurFade({ delay = 0, offset = 6, blur = '4px', inView = false, children, ...props }: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const visible = !inView || seen
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, y: offset, filter: `blur(${blur})` }
  const shown = reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={visible ? shown : hidden}
      transition={{ delay, duration: DURATION.slow, ease: EASE.emphasized }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
