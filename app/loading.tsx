'use client'

import { translate } from '@/i18n/dataview'
import { Skeleton } from '@/ui/shadcn/skeleton'

const TILES = ['a', 'b', 'c', 'd']
const ROWS = ['w-full', 'w-5/6', 'w-2/3', 'w-3/4']

export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{translate('shell.loading')}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <div key={tile} className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-card sm:min-h-36 sm:p-5">
            <Skeleton className="size-8 rounded-lg sm:size-9" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-card sm:p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card sm:p-5">
          <Skeleton className="h-4 w-32" />
          {ROWS.map((width) => (
            <Skeleton key={width} className={`h-4 ${width}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
