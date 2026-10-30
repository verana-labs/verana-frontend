import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Trend = 'up' | 'down' | 'flat'

export type DeltaPillProps = {
  value: string
  trend: Trend
  tone?: Trend
  label?: string
  className?: string
}

const TONES: Record<Trend, string> = {
  up: 'bg-tint-success text-success',
  down: 'bg-tint-destructive text-destructive',
  flat: 'bg-tint-neutral text-muted-foreground',
}

const ICONS = { up: TrendingUpIcon, down: TrendingDownIcon, flat: MinusIcon }

const SIGNS: Record<Trend, string> = { up: '+', down: '-', flat: '' }

export function DeltaPill({ value, trend, tone = trend, label, className }: DeltaPillProps) {
  const Icon = ICONS[trend]
  return (
    <span
      title={label}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-xs leading-none font-medium whitespace-nowrap tabular-nums',
        TONES[tone],
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      <span className="sr-only">{SIGNS[trend]}</span>
      {value}
      {label ? <span className="sr-only"> {label}</span> : null}
    </span>
  )
}
