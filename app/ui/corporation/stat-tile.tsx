'use client'

import { TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StatTile({
  label,
  value,
  hint,
  icon,
  stat,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ReactNode
  stat?: string
  className?: string
}) {
  return (
    <div
      data-stat={stat}
      className={cn(
        'group relative isolate flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-xl bg-card p-4 shadow-card sm:min-h-36 sm:p-5',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px] text-primary/25 [mask-image:radial-gradient(180px_circle_at_top_right,white,transparent)]"
      />
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-(--duration-slow) ease-emphasized group-hover:scale-90 sm:size-9 [&_svg]:size-4 sm:[&_svg]:size-4.5"
      >
        {icon}
      </span>
      <div className="mt-3 min-w-0 sm:mt-4">
        <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <div className="mt-1 flex min-h-8 items-center truncate text-2xl leading-tight font-semibold tracking-tight text-foreground tabular-nums sm:min-h-9 sm:text-3xl">
          {value}
        </div>
        <div className="mt-1 min-h-4 truncate text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  )
}

export function UnknownStat({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-lg font-medium tracking-normal text-muted-foreground sm:text-xl">
      <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
      {label}
    </span>
  )
}
