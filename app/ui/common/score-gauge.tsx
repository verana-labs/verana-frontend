import { cn } from '@/lib/utils'

export const GAUGE_BARS = 21

const BAR_KEYS = Array.from({ length: GAUGE_BARS }, (_, index) => `bar-${index}`)

export function litBars(percent: number): number {
  if (!Number.isFinite(percent)) return 0
  return Math.round((Math.min(100, Math.max(0, percent)) / 100) * GAUGE_BARS)
}

function rampColor(index: number): string {
  const t = index / (GAUGE_BARS - 1)
  if (t <= 0.5) return `color-mix(in oklab, var(--warning) ${Math.round(t * 200)}%, var(--destructive))`
  return `color-mix(in oklab, var(--success) ${Math.round((t - 0.5) * 200)}%, var(--warning))`
}

function brandColor(index: number): string {
  return `color-mix(in oklab, var(--primary) ${45 + Math.round((index / (GAUGE_BARS - 1)) * 55)}%, transparent)`
}

export type ScoreGaugeProps = {
  percent: number
  label: string
  tone?: 'ramp' | 'brand'
  size?: 'sm' | 'md'
  className?: string
}

export function ScoreGauge({ percent, label, tone = 'ramp', size = 'md', className }: ScoreGaugeProps) {
  const lit = litBars(percent)
  const color = tone === 'ramp' ? rampColor : brandColor
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Number.isFinite(percent) ? Math.round(Math.min(100, Math.max(0, percent))) : 0}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-between gap-px',
        size === 'sm' ? 'h-4' : 'h-6',
        className
      )}
    >
      {BAR_KEYS.map((key, index) => (
        <span
          key={key}
          aria-hidden="true"
          className={cn('h-full w-[3px] shrink-0 rounded-full', index >= lit && 'bg-track')}
          style={index < lit ? { backgroundColor: color(index) } : undefined}
        />
      ))}
    </span>
  )
}
