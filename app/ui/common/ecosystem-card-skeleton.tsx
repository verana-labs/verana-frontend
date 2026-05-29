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
    <div className={`flex items-start overflow-hidden ${rowClass}`}>
      <div className={`skeleton flex-shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className={`skeleton ${titleClass}`} />
        <div className={`skeleton ${subtitleClass}`} />
      </div>
    </div>
  )
}

function SkeletonStatRow() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-4 w-16" />
    </div>
  )
}

export default function EcosystemCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-full bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden"
    >
      <div className={CARD_BODY_CLASS}>
        <SkeletonMediaRow
          rowClass="space-x-3"
          iconClass="w-12 h-12 rounded-lg"
          titleClass="h-5 w-3/4"
          subtitleClass="h-3 w-1/2"
        />
        <SkeletonMediaRow
          rowClass="space-x-2"
          iconClass="w-8 h-8 rounded"
          titleClass="h-4 w-2/3"
          subtitleClass="h-3 w-1/4"
        />

        <div className="flex items-start gap-2">
          <div className="skeleton-badge w-20" />
          <div className="skeleton-badge w-14" />
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
