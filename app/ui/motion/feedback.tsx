'use client'

import { type HTMLMotionProps, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/ui/motion/tokens'

export function SuccessCheck({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('size-12 text-success', className)}
      initial={reduced ? false : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE.emphasized }}
    >
      <circle cx="12" cy="12" r="11" className="fill-success/10 stroke-success/30" strokeWidth="1" />
      <motion.path
        d="M7 12.5l3.2 3.2L17 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: DURATION.base, duration: DURATION.slow, ease: EASE.standard }}
      />
    </motion.svg>
  )
}

type ErrorShakeProps = HTMLMotionProps<'div'> & { trigger: unknown }

export function ErrorShake({ trigger, ...props }: ErrorShakeProps) {
  const reduced = useReducedMotion()
  const controls = useAnimationControls()

  useEffect(() => {
    if (!trigger) return
    void controls.start({
      ...(reduced ? { opacity: [1, 0.6, 1] } : { x: [0, -6, 6, -4, 4, 0] }),
      transition: { duration: DURATION.slow * 1.5, ease: EASE.standard },
    })
  }, [trigger, reduced, controls])

  return <motion.div animate={controls} {...props} />
}
