'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/ui/motion/tokens'

export interface CategorySegment {
  key: string
  value: number
  className: string
}

export function CategoryBar({
  segments,
  marker,
  className,
}: {
  segments: CategorySegment[]
  marker?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const max = segments.reduce((sum, segment) => sum + segment.value, 0)
  const markerLeft = marker !== undefined && max > 0 ? (Math.min(Math.max(marker, 0), max) / max) * 100 : undefined

  return (
    <div className={cn('relative flex h-2 w-full items-center', className)}>
      <motion.div
        className="flex h-full flex-1 origin-left items-center overflow-hidden rounded-full bg-track rtl:origin-right"
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: DURATION.slow * 2, ease: EASE.emphasized }}
      >
        {segments
          .filter((segment) => segment.value > 0 && max > 0)
          .map((segment, index) => (
            <div
              key={segment.key}
              className={cn('h-full', index > 0 && 'border-s-2 border-card', segment.className)}
              style={{ width: `${(segment.value / max) * 100}%` }}
            />
          ))}
      </motion.div>
      {markerLeft !== undefined ? (
        <span
          aria-hidden="true"
          className="absolute h-4 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card rtl:translate-x-1/2"
          style={{ insetInlineStart: `${markerLeft}%` }}
        />
      ) : null}
    </div>
  )
}
