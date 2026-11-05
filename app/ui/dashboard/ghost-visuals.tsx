import { useId } from 'react'
import { cn } from '@/lib/utils'
import { chartGradientId } from '@/ui/common/chart-craft'

const GHOST_LINE =
  'M0,150 C40,140 70,118 110,124 C150,130 175,96 215,88 C255,80 280,104 320,92 C360,80 390,46 430,52 C470,58 500,30 540,26 C570,23 590,34 600,30'

export function GhostArea({ className }: { className?: string }) {
  const id = chartGradientId(useId())
  return (
    <svg
      viewBox="0 0 600 180"
      preserveAspectRatio="none"
      className={cn('h-full min-h-48 w-full text-primary', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.5} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[45, 90, 135].map((y) => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
      ))}
      <path d={`${GHOST_LINE} L600,180 L0,180 Z`} fill={`url(#${id})`} />
      <path d={GHOST_LINE} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const GHOST_ROWS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3', 'w-2/5'].map((width, index) => ({ id: `row-${index}`, width }))

export function GhostRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex w-full flex-col gap-3 pt-2', className)} aria-hidden="true">
      {GHOST_ROWS.slice(0, rows).map(({ id, width }) => (
        <div key={id} className="flex items-center gap-3">
          <span className="size-9 shrink-0 rounded-lg bg-primary" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className={cn('h-2.5 rounded-full bg-foreground', width)} />
            <span className="h-2 w-1/4 rounded-full bg-muted-foreground" />
          </span>
          <span className="h-2.5 w-10 rounded-full bg-foreground" />
        </div>
      ))}
    </div>
  )
}
