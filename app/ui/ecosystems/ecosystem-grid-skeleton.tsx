import { Shimmer } from '@/ui/motion/shimmer'

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-card">
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex items-start gap-3.5">
          <Shimmer className="size-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2 py-1">
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border px-5 py-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="flex min-h-11 items-center border-t border-border bg-muted/50 px-5 dark:bg-muted/30">
        <Shimmer className="h-3 w-32" />
      </div>
    </div>
  )
}

export function EcosystemGridSkeleton({ count, className }: { count: number; className: string }) {
  return (
    <div aria-hidden="true" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
