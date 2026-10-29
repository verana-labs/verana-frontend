'use client'

import { TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { DotPattern } from '@/ui/dashboard/dot-pattern'

export type StatTileProps = {
  label: ReactNode
  value: ReactNode
  icon: ReactNode
  hint?: ReactNode
  trend?: ReactNode
  pattern?: boolean
  stat?: string
  statValue?: string
  className?: string
}

export function StatTile({
  label,
  value,
  icon,
  hint,
  trend,
  pattern = true,
  stat,
  statValue,
  className,
}: StatTileProps) {
  return (
    <div
      data-stat={stat}
      data-stat-value={statValue}
      className={cn(
        'relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-card p-4 shadow-card sm:p-5',
        className
      )}
    >
      {pattern ? (
        <DotPattern
          width={14}
          height={14}
          className="-z-10 text-primary/25 [mask-image:radial-gradient(160px_circle_at_top_right,white,transparent)]"
        />
      ) : null}
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-3.5"
        >
          {icon}
        </span>
        <span className="line-clamp-2 min-w-0 text-xs leading-snug font-medium text-muted-foreground sm:text-sm">
          {label}
        </span>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <div className="min-w-0 truncate text-2xl leading-tight font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">
          {value}
        </div>
        {trend ? <div className="shrink-0 text-xs font-medium tabular-nums">{trend}</div> : null}
      </div>
      {hint ? <div className="mt-1 min-w-0 truncate text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function UnknownStat({ label = translate('common.unknown') }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-lg font-medium tracking-normal text-muted-foreground sm:text-xl">
      <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
      {label}
    </span>
  )
}
