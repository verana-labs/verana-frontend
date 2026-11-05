'use client'

import { TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { DeltaPill, type DeltaPillProps } from '@/ui/common/delta-pill'
import { DotPattern } from '@/ui/dashboard/dot-pattern'

export type StatTileProps = {
  label: ReactNode
  value: ReactNode
  icon: ReactNode
  hint?: ReactNode
  delta?: DeltaPillProps | null
  trend?: ReactNode
  meter?: ReactNode
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
  delta,
  trend,
  meter,
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
        'group relative isolate flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-xl bg-card p-4 shadow-card sm:min-h-36 sm:p-5',
        className
      )}
    >
      {pattern ? (
        <DotPattern
          width={18}
          height={18}
          className="-z-10 text-primary/25 [mask-image:radial-gradient(180px_circle_at_top_right,white,transparent)]"
        />
      ) : null}
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tint-accent text-primary transition-transform duration-(--duration-slow) ease-emphasized group-hover:scale-90 motion-reduce:transition-none sm:size-9 [&_svg]:size-4 sm:[&_svg]:size-4.5"
        >
          {icon}
        </span>
        {meter ? <div className="flex w-24 min-w-0 sm:w-28">{meter}</div> : null}
      </div>
      <div className="mt-3 min-w-0 sm:mt-4">
        <p className="truncate text-xs font-medium text-muted-foreground sm:text-[13px]">{label}</p>
        <div className="mt-1 flex min-h-8 min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 sm:min-h-9">
          <div className="min-w-0 truncate text-2xl leading-tight font-semibold tracking-[-0.025em] text-foreground tabular-nums sm:text-3xl">
            {value}
          </div>
          {delta ? <DeltaPill {...delta} /> : null}
          {trend ? <div className="shrink-0 text-xs font-medium tabular-nums">{trend}</div> : null}
        </div>
        <div className="mt-1 min-h-4 truncate text-xs text-muted-foreground">{hint}</div>
      </div>
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
