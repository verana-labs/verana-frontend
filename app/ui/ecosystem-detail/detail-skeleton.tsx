import { translate } from '@/i18n/dataview'
import { Shimmer } from '@/ui/motion/shimmer'

export function SchemaCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-4 rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Shimmer className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-2/3" />
              <Shimmer className="h-3 w-10" />
            </div>
          </div>
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-4/5" />
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Shimmer className="h-8" />
            <Shimmer className="h-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EcosystemDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      <span className="sr-only">{translate('shell.loading')}</span>
      <Shimmer className="h-7 w-20" />
      <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-card sm:p-6 md:flex-row">
        <Shimmer className="size-16 rounded-2xl sm:size-20" />
        <div className="flex-1 space-y-3">
          <Shimmer className="h-8 w-1/3" />
          <Shimmer className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Shimmer className="h-6 w-24 rounded-full" />
            <Shimmer className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Shimmer key={index} className="h-28 rounded-xl sm:h-32" />
        ))}
      </div>
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Shimmer key={index} className="h-5 w-20" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-5 rounded-xl bg-card p-4 shadow-card sm:p-5">
            <Shimmer className="h-5 w-1/3" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, field) => (
                <div key={field} className="space-y-2">
                  <Shimmer className="h-3 w-1/3" />
                  <Shimmer className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
