'use client'

import { translate } from '@/i18n/dataview'
import { Shimmer } from '@/ui/motion/shimmer'

export function CorporationPageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">{translate('corporation.page.loading')}</span>
      <div className="overflow-hidden rounded-xl bg-card shadow-card">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Shimmer className="size-12 shrink-0 rounded-xl sm:size-14" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Shimmer className="h-7 w-56 max-w-full" />
              <Shimmer className="h-4 w-80 max-w-full" />
              <Shimmer className="h-7 w-32 max-w-full rounded-full" />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Shimmer className="h-10 w-32 rounded-lg" />
            <Shimmer className="h-10 w-40 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden border-t border-border px-5 py-3.5 sm:px-6">
          {['w-16', 'w-18', 'w-20', 'w-24', 'w-18', 'w-20'].map((width, index) => (
            <Shimmer key={`tab-${index}-${width}`} className={`h-4 shrink-0 ${width}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {['deposit', 'members', 'proposals', 'operators'].map((key) => (
          <div key={key} className="min-h-36 min-w-0 space-y-4 rounded-xl bg-card p-4 shadow-card sm:p-5">
            <Shimmer className="size-9 rounded-lg" />
            <Shimmer className="h-4 w-20 max-w-full" />
            <Shimmer className="h-8 w-24 max-w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl bg-card p-6 shadow-card lg:col-span-2">
          {['a', 'b', 'c'].map((key) => (
            <div key={key} className="space-y-2">
              <Shimmer className="h-4 w-48 max-w-full" />
              <Shimmer className="h-3 w-72 max-w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-xl bg-card p-6 shadow-card">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-10 w-full" />
          <Shimmer className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
