import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Timeline({ className, ...props }: ComponentProps<'ol'>) {
  return <ol data-slot="timeline" className={cn('group/timeline flex flex-col', className)} {...props} />
}

export function TimelineItem({ className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      data-slot="timeline-item"
      className={cn('group/timeline-item relative ms-10 flex flex-col gap-0.5 not-last:pb-6', className)}
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
  return <div data-slot="timeline-content" className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function TimelineIndicator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="timeline-indicator"
      className={cn(
        'absolute top-0 -start-10 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground ring-4 ring-card [&_svg]:size-3.5',
        className
      )}
      {...props}
    />
  )
}

export function TimelineSeparator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="timeline-separator"
      className={cn(
        'absolute top-8 -start-[26.5px] h-[calc(100%-2.25rem)] w-px bg-foreground/12 group-last/timeline-item:hidden',
        className
      )}
      {...props}
    />
  )
}
