import { cn } from '@/lib/utils'
import { Shimmer } from '@/ui/motion/shimmer'

type BarProps = { ghost: boolean; tone?: 'accent' | 'strong' | 'soft'; className: string }

const GHOST_TONES = {
  accent: 'bg-primary/45',
  strong: 'bg-foreground/40',
  soft: 'bg-foreground/20',
}

function Bar({ ghost, tone = 'soft', className }: BarProps) {
  if (!ghost) return <Shimmer className={className} />
  return <span className={cn('block rounded-md', GHOST_TONES[tone], className)} />
}

function CardSkeleton({ ghost }: { ghost: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-card">
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex items-start gap-3.5">
          <Bar ghost={ghost} tone="accent" className="size-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Bar ghost={ghost} tone="strong" className="h-4 w-3/4" />
            <Bar ghost={ghost} className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2 py-1">
          <Bar ghost={ghost} className="h-3 w-full" />
          <Bar ghost={ghost} className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border px-5 py-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Bar ghost={ghost} className="h-3 w-20" />
            <Bar ghost={ghost} tone="accent" className="h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="flex min-h-11 items-center border-t border-border bg-muted/50 px-5 dark:bg-muted/30">
        <Bar ghost={ghost} className="h-3 w-32" />
      </div>
    </div>
  )
}

export function EcosystemGridSkeleton({
  count,
  className,
  ghost = false,
}: {
  count: number
  className: string
  ghost?: boolean
}) {
  return (
    <div aria-hidden="true" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('h-full', ghost && 'max-md:[&:nth-child(n+2)]:hidden')}>
          <CardSkeleton ghost={ghost} />
        </div>
      ))}
    </div>
  )
}
