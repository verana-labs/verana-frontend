import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DeltaPill, type DeltaPillProps } from '@/ui/common/delta-pill'

export type KpiStatProps = {
  label: ReactNode
  value: ReactNode
  delta?: DeltaPillProps | null
  caption?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  stat?: string
  statValue?: string
  children?: ReactNode
  className?: string
}

const VALUE_SIZES = {
  sm: 'text-xl leading-7 tracking-[-0.015em]',
  md: 'text-[28px] leading-8 tracking-[-0.025em]',
  lg: 'text-4xl leading-10 tracking-[-0.03em] @md/page:text-5xl @md/page:leading-[3.25rem]',
}

export function KpiStat({
  label,
  value,
  delta,
  caption,
  size = 'md',
  stat,
  statValue,
  children,
  className,
}: KpiStatProps) {
  return (
    <div data-stat={stat} data-stat-value={statValue} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="truncate text-xs font-medium text-muted-foreground sm:text-[13px]">{label}</div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <div className={cn('min-w-0 truncate font-semibold text-foreground tabular-nums', VALUE_SIZES[size])}>
          {value}
        </div>
        {delta ? <DeltaPill {...delta} /> : null}
      </div>
      {caption ? <div className="truncate text-xs text-muted-foreground">{caption}</div> : null}
      {children}
    </div>
  )
}
