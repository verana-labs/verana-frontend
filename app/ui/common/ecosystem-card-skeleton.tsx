import { CARD_BODY_CLASS } from './ecosystem-card'

const STAT_ROW_COUNT = 5

export default function EcosystemCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-full bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden"
    >
      <div className={CARD_BODY_CLASS}>
        <div className="flex items-start space-x-3 overflow-hidden">
          <div className="skeleton w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>

        <div className="flex items-start space-x-2 overflow-hidden">
          <div className="skeleton w-8 h-8 rounded flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/4" />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="skeleton-badge w-20" />
          <div className="skeleton-badge w-14" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: STAT_ROW_COUNT }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
