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
      <div
        aria-hidden="true"
        className="pointer-events-none flex w-full flex-1 opacity-[0.16] select-none [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black_75%)] dark:opacity-[0.12]"
      >
        {children ?? <GhostBars />}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl bg-card/85 px-5 py-4 text-center shadow-hairline supports-backdrop-filter:backdrop-blur-sm">
          {icon ? (
            <span
              aria-hidden="true"
              className="mb-1 flex size-9 items-center justify-center rounded-lg bg-tint-accent text-primary [&_svg]:size-4"
            >
              {icon}
            </span>
          ) : null}
          <p className="text-sm font-medium text-foreground text-balance [overflow-wrap:anywhere]">{title}</p>
          {description ? (
            <p className="max-w-xs text-xs leading-5 text-muted-foreground text-pretty [overflow-wrap:anywhere]">
              {description}
            </p>
          ) : null}
          {action ? <div className="mt-1.5">{action}</div> : null}
        </div>
      </div>
    </div>
  )
}
