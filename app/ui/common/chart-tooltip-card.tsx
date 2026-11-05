'use client'

import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChartTooltipContent } from '@/ui/shadcn/chart'

const INVERTED =
  'rounded-[10px] border border-tooltip-border bg-tooltip px-3 py-2.5 text-tooltip-foreground shadow-pop [&_.text-foreground]:text-tooltip-foreground [&_.text-muted-foreground]:text-tooltip-muted'

export function ChartTooltipCard({ className, ...props }: ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent {...props} className={cn(INVERTED, 'min-w-36 gap-2 [&_.font-mono]:font-sans', className)} />
  )
}

export type TipCardProps = {
  title: ReactNode
  aside?: ReactNode
  children?: ReactNode
  className?: string
}

export function TipCard({ title, aside, children, className }: TipCardProps) {
  return (
    <div className={cn('flex min-w-36 flex-col gap-2 text-xs whitespace-nowrap', INVERTED, className)}>
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 text-[13px] font-medium">{title}</span>
        {aside !== undefined && aside !== null ? (
          <span className="shrink-0 text-tooltip-muted tabular-nums">{aside}</span>
        ) : null}
      </div>
      {children ? <div className="flex flex-col gap-1">{children}</div> : null}
    </div>
  )
}

export type TipRowProps = {
  label: ReactNode
  value: ReactNode
  color?: string
  shape?: 'square' | 'dot' | 'line' | 'dash'
}

export function TipRow({ label, value, color, shape = 'square' }: TipRowProps) {
  return (
    <div className="flex items-center gap-2">
      {color ? (
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0',
            shape === 'square' && 'size-2 rounded-[2px]',
            shape === 'dot' && 'size-2 rounded-full',
            shape === 'line' && 'h-0.5 w-3 rounded-full',
            shape === 'dash' && 'h-0 w-3 border-t-[1.5px] border-dashed'
          )}
          style={shape === 'dash' ? { borderColor: color } : { backgroundColor: color }}
        />
      ) : null}
      <span className="flex-1 text-tooltip-muted">{label}</span>
      <span className="pl-3 font-medium text-tooltip-foreground tabular-nums">{value}</span>
    </div>
  )
}
