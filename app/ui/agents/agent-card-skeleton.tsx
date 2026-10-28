import { Shimmer } from '@/ui/motion/shimmer'

export function AgentCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-card" aria-hidden="true">
      <div className="flex items-start gap-3.5 p-4 sm:p-5">
        <Shimmer className="size-12 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Shimmer className="h-4 w-2/5" />
          <Shimmer className="h-3 w-4/5" />
          <Shimmer className="h-5 w-3/5" />
        </div>
      </div>
      {[0, 1, 2].map((section) => (
        <div key={section} className="flex flex-col gap-2 border-t border-border px-4 py-3.5 sm:px-5">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}
