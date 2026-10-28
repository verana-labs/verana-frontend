import { Shimmer } from '@/ui/motion/shimmer'

export function DiscoverCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card sm:p-6">
      <div className="flex gap-4">
        <Shimmer className="size-14 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Shimmer className="h-5 w-2/5" />
          <Shimmer className="h-3.5 w-3/5" />
          <Shimmer className="h-3.5 w-1/4" />
        </div>
        <Shimmer className="hidden h-8 w-36 rounded-lg sm:block" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((cell) => (
          <Shimmer key={cell} className="h-16 rounded-lg" />
        ))}
      </div>
      <Shimmer className="mt-6 h-24 rounded-lg" />
    </div>
  )
}
