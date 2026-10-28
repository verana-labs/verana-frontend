'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Shimmer({ className, ...props }: ComponentProps<'div'>) {
  const reduced = useReducedMotion()
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('skeleton-delay relative overflow-hidden rounded-md bg-muted', className)}
      {...props}
    >
      {!reduced && (
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-foreground/[0.06] to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.4, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </div>
  )
}
