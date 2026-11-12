'use client'

import { type ComponentProps, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

const CompactTimeline = createContext(false)

export function Timeline({ compact = false, className, ...props }: ComponentProps<'ol'> & { compact?: boolean }) {
  return (
    <CompactTimeline.Provider value={compact}>
      <ol data-slot="timeline" className={cn('group/timeline flex flex-col', className)} {...props} />
    </CompactTimeline.Provider>
  )
}

export function TimelineItem({ done = true, className, ...props }: ComponentProps<'li'> & { done?: boolean }) {
  const compact = useContext(CompactTimeline)
  return (
    <li
      data-slot="timeline-item"
      data-completed={done || undefined}
      className={cn(
        'group/timeline-item relative flex flex-col gap-0.5',
        compact
          ? 'ms-7 pb-6 last:pb-0 has-[+[data-completed]]:[&_[data-slot=timeline-separator]]:bg-primary/40'
          : 'ms-10 not-last:pb-6',
        className
      )}
      {...props}
    />
  )
}

export function TimelineHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="timeline-header" className={cn('flex flex-wrap items-baseline gap-x-2', className)} {...props} />
  )
}

export function TimelineTitle({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="timeline-title" className={cn('text-sm font-medium text-foreground', className)} {...props} />
}

export function TimelineDate({ className, ...props }: ComponentProps<'time'>) {
  return (
    <time
      data-slot="timeline-date"
      className={cn('block text-xs text-muted-foreground tabular-nums', className)}
      {...props}
    />
  )
}

export function TimelineContent({ className, ...props }: ComponentProps<'div'>) {
  const compact = useContext(CompactTimeline)
  return (
    <div
      data-slot="timeline-content"
      className={cn(compact ? 'text-xs' : 'text-sm', 'text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TimelineIndicator({ className, ...props }: ComponentProps<'span'>) {
  const compact = useContext(CompactTimeline)
  return (
    <span
      aria-hidden="true"
      data-slot="timeline-indicator"
      className={cn(
        'absolute flex items-center justify-center rounded-full',
        compact
          ? 'top-0.5 -start-7 size-4 border-2 border-primary/25 bg-card group-data-completed/timeline-item:border-primary [&_svg]:size-2.5'
          : 'top-0 -start-10 size-7 bg-muted text-muted-foreground ring-4 ring-card [&_svg]:size-3.5',
        className
      )}
      {...props}
    />
  )
}

export function TimelineSeparator({ className, ...props }: ComponentProps<'span'>) {
  const compact = useContext(CompactTimeline)
  return (
    <span
      aria-hidden="true"
      data-slot="timeline-separator"
      className={cn(
        'absolute w-px group-last/timeline-item:hidden',
        compact
          ? 'top-5 -start-5 h-[calc(100%-1.5rem)] bg-border'
          : 'top-8 -start-[26.5px] h-[calc(100%-2.25rem)] bg-foreground/12',
        className
      )}
      {...props}
    />
  )
}
