'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'

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
  marker?: { value: number; tooltip: string }
  className?: string
}) {
  const reduced = useReducedMotion()
  const max = segments.reduce((sum, segment) => sum + segment.value, 0)
  const markerLeft = marker && max > 0 ? (Math.min(Math.max(marker.value, 0), max) / max) * 100 : marker ? 0 : undefined

  return (
    <div className={cn('relative flex h-2 w-full items-center', className)}>
      <motion.div
        className="flex h-full flex-1 origin-left items-center overflow-hidden rounded-full bg-muted rtl:origin-right"
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
      {marker && markerLeft !== undefined ? (
        <div
          className="absolute w-2 -translate-x-1/2 rtl:translate-x-1/2"
          style={{ insetInlineStart: `${markerLeft}%` }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={marker.tooltip}
                className="relative mx-auto block h-4 w-1 cursor-default rounded-full bg-foreground ring-2 ring-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <span aria-hidden="true" className="absolute -inset-x-2 -inset-y-1" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{marker.tooltip}</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
    </div>
  )
}
