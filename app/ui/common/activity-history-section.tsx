'use client'

import type { useActivityHistory } from '@/hooks/useActivityHistory'
import { translate } from '@/i18n/dataview'
import { ActivityTimeline } from '@/ui/corporation/activity'

export function ActivityHistorySection({ history }: { history: ReturnType<typeof useActivityHistory> }) {
  return (
    <section id="activity" className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">{translate('activity.title')}</h2>
      {history.partial ? (
        <p className="pb-2 text-xs text-neutral-70 dark:text-neutral-70">{translate('activity.partial')}</p>
      ) : null}
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
        {history.failed ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">{translate('activity.unavailable')}</p>
        ) : history.loading && history.rows.length === 0 ? (
          <p className="text-sm text-gray-500">{translate('activity.loading')}</p>
        ) : (
          <ActivityTimeline rows={history.rows} />
        )}
      </div>
    </section>
  )
}
