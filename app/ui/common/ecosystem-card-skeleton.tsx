import { cn } from '@/lib/utils'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { CARD_BODY_CLASS } from './ecosystem-card'

const STAT_ROW_COUNT = 5

type SkeletonMediaRowProps = {
  rowClass: string
  iconClass: string
  titleClass: string
  subtitleClass: string
}

function SkeletonMediaRow({ rowClass, iconClass, titleClass, subtitleClass }: SkeletonMediaRowProps) {
  return (
    <div className={cn('flex items-start overflow-hidden', rowClass)}>
      <Skeleton className={cn('shrink-0', iconClass)} />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className={titleClass} />
        <Skeleton className={subtitleClass} />
      </div>
    </div>
  )
}

function SkeletonStatRow() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export default function EcosystemCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="skeleton-delay h-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
    >
      <div className={CARD_BODY_CLASS}>
        <SkeletonMediaRow
          rowClass="gap-3"
          iconClass="size-12 rounded-lg"
          titleClass="h-5 w-3/4"
          subtitleClass="h-3 w-1/2"
        />
        <SkeletonMediaRow
          rowClass="gap-2"
          iconClass="size-8 rounded-md"
          titleClass="h-4 w-2/3"
          subtitleClass="h-3 w-1/4"
        />

        <div className="flex items-start gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: STAT_ROW_COUNT }, (_, i) => (
            <SkeletonStatRow key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
