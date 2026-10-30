import { cn } from '@/lib/utils'
import { Section } from '@/ui/dataview/types'
import { Skeleton } from '@/ui/shadcn/skeleton'

interface DataViewSkeletonProps<T> {
  sections: Section<T>[]
}

const CARD_CLASS = 'rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6'

export default function DataViewSkeleton<T>({ sections }: DataViewSkeletonProps<T>) {
  return (
    <div className="skeleton-delay flex flex-col gap-6" aria-busy="true" aria-hidden="true">
      {sections.map(({ type, cardView, sectionBorder, name, fields, largeTexts }, i) => {
        const isActions = type === 'actions'

        return (
          <div key={i} className={cn((!cardView || sectionBorder) && CARD_CLASS)}>
            {name && <Skeleton className="mb-6 h-6 w-1/4" />}

            {isActions ? (
              <div className="flex flex-wrap gap-4">
                {fields?.map((_, j) => (
                  <Skeleton key={j} className="h-10 w-40 rounded-lg" />
                ))}
              </div>
            ) : (
              <div
                className={
                  cardView
                    ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid grid-cols-1 gap-4 md:grid-cols-2'
                }
              >
                {fields?.map((_, j) => (
                  <div
                    key={j}
                    className={cn(
                      'flex flex-col gap-2',
                      cardView && 'rounded-xl bg-card p-4 ring-1 ring-foreground/10'
                    )}
                  >
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className={largeTexts ? 'h-8 w-1/2' : 'h-5 w-2/3'} />
                    {!cardView && !largeTexts && <Skeleton className="h-3 w-1/2" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
