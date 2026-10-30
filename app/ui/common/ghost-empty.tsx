import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const GHOST_BARS = [34, 52, 41, 63, 48, 72, 58, 80, 66, 54, 76, 62, 88, 70, 57, 83, 68, 92, 74, 61].map(
  (height, index) => ({
    id: `ghost-${index}`,
    height,
  })
)

export function GhostBars({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full min-h-40 w-full items-end gap-1.5', className)}>
      {GHOST_BARS.map(({ id, height }) => (
        <span key={id} className="flex-1 rounded-t-[3px] bg-primary" style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

export type GhostEmptyProps = {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children?: ReactNode
  className?: string
}

export function GhostEmpty({ title, description, icon, action, children, className }: GhostEmptyProps) {
  return (
    <div className={cn('relative isolate flex min-h-48 flex-1', className)}>
      <div aria-hidden="true" className="pointer-events-none flex w-full flex-1 opacity-[0.22] select-none">
        {children ?? <GhostBars />}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
        {icon ? (
          <span
            aria-hidden="true"
            className="mb-1 flex size-9 items-center justify-center rounded-lg bg-card text-primary shadow-hairline [&_svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <p className="text-sm font-medium text-foreground text-balance">{title}</p>
        {description ? <p className="max-w-xs text-xs text-muted-foreground text-balance">{description}</p> : null}
        {action ? <div className="mt-1.5">{action}</div> : null}
      </div>
    </div>
  )
}
