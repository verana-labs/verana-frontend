'use client'

import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Timeline({ className, ...props }: ComponentProps<'ol'>) {
  return <ol data-slot="timeline" className={cn('flex flex-col', className)} {...props} />
}

export function TimelineItem({ done = true, className, ...props }: ComponentProps<'li'> & { done?: boolean }) {
  return (
    <li
      data-slot="timeline-item"
      data-completed={done || undefined}
      className={cn(
        'group/timeline-item relative ms-7 flex flex-col gap-0.5 pb-6 last:pb-0 has-[+[data-completed]]:[&_[data-slot=timeline-separator]]:bg-primary/40',
        className
      )}
      {...props}
    />
  )
}

export function TimelineSeparator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="timeline-separator"
      className={cn(
        'absolute top-5 -start-5 h-[calc(100%-1.5rem)] w-px bg-border group-last/timeline-item:hidden',
        className
      )}
    />
  )
}

export function TimelineIndicator({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      data-slot="timeline-indicator"
      className={cn(
        'absolute top-0.5 -start-7 flex size-4 items-center justify-center rounded-full border-2 border-primary/25 bg-card group-data-completed/timeline-item:border-primary [&_svg]:size-2.5',
        className
      )}
    >
      {children}
    </span>
  )
}

export function TimelineTitle({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="timeline-title" className={cn('text-sm font-medium text-foreground', className)} {...props} />
}

export function TimelineDate({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p data-slot="timeline-date" className={cn('text-xs text-muted-foreground tabular-nums', className)} {...props} />
  )
}

export function TimelineContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="timeline-content" className={cn('text-xs text-muted-foreground', className)} {...props} />
}
