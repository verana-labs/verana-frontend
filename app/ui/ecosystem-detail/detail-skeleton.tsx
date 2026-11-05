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
    <div role="status" aria-busy="true">
      <span className="sr-only">{translate('shell.loading')}</span>
      <Shimmer className="mb-4 h-8 w-20" />
      <div className="mb-4 flex flex-col gap-5 rounded-2xl bg-linear-to-br from-primary/10 via-card to-card p-5 shadow-card sm:mb-5 sm:p-6 md:flex-row md:gap-6 dark:from-primary/15">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
          <Shimmer className="size-14 shrink-0 rounded-2xl bg-primary/15 sm:size-20" />
          <div className="min-w-0 flex-1 space-y-3 pt-1">
            <Shimmer className="h-7 w-2/3 bg-foreground/10 sm:w-1/3" />
            <Shimmer className="h-4 w-1/2 bg-foreground/10" />
            <div className="flex gap-2 pt-1">
              <Shimmer className="h-6 w-20 rounded-full bg-foreground/10" />
              <Shimmer className="h-6 w-16 rounded-full bg-primary/15" />
            </div>
          </div>
        </div>
        <div className="space-y-2 md:min-w-48 md:border-s md:border-border/70 md:ps-6">
          <Shimmer className="h-3 w-20 bg-foreground/10 md:ms-auto" />
          <Shimmer className="h-7 w-28 bg-foreground/10 md:ms-auto" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col justify-between gap-4 rounded-xl bg-card p-4 shadow-card sm:min-h-36 sm:p-5"
          >
            <Shimmer className="size-8 rounded-lg bg-primary/15 sm:size-9" />
            <div className="space-y-2">
              <Shimmer className="h-3 w-20 bg-foreground/10" />
              <Shimmer className="h-7 w-14 bg-foreground/10" />
              <Shimmer className="h-3 w-3/4 bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-10 items-center gap-5 overflow-hidden border-b border-border px-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Shimmer key={index} className="h-4 w-16 shrink-0 bg-foreground/10" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`space-y-5 rounded-xl bg-card p-4 shadow-card sm:p-5 ${index === 2 ? 'lg:col-span-2 xl:col-span-1' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Shimmer className="size-8 rounded-lg bg-primary/15" />
              <Shimmer className="h-4 w-1/3 bg-foreground/10" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Array.from({ length: 4 }, (_, field) => (
                <div key={field} className="space-y-2">
                  <Shimmer className="h-3 w-1/2 bg-foreground/10" />
                  <Shimmer className="h-4 w-3/4 bg-foreground/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
