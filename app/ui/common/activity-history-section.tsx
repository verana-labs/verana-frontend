'use client'

import { HistoryIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { useActivityHistory } from '@/hooks/useActivityHistory'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/ui/common/empty-state'
import { SegmentedControl } from '@/ui/common/segmented-control'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Shimmer } from '@/ui/motion/shimmer'
import { ACTIVITY_KINDS, type ActivityKind, activityKind, HistoryTimeline } from '@/ui/participants/history-timeline'
import { Badge } from '@/ui/shadcn/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'

function ActivitySkeleton() {
  return (
    <div className="space-y-5">
      <p role="status" className="sr-only">
        {translate('activity.loading')}
      </p>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <Shimmer className="size-7 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Shimmer className="h-3.5 w-40" />
            <Shimmer className="h-3 w-64 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

type ActivityFilter = 'all' | ActivityKind

const FULL_TIMELINE_ROWS = 50

function ActivityFilterBar({
  counts,
  total,
  value,
  onChange,
}: {
  counts: Map<ActivityKind, number>
  total: number
  value: ActivityFilter
  onChange: (value: ActivityFilter) => void
}) {
  const count = (n: number) => <span className="text-muted-foreground tabular-nums">{n}</span>
  return (
    <div className="-mx-1 mb-5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <SegmentedControl<ActivityFilter>
        label={translate('activity.filter.label')}
        value={value}
        onValueChange={onChange}
        items={[
          {
            value: 'all',
            label: (
              <>
                {translate('activity.filter.all')}
                {count(total)}
              </>
            ),
          },
          ...ACTIVITY_KINDS.flatMap((kind) => {
            const n = counts.get(kind) ?? 0
            return n === 0
              ? []
              : [
                  {
                    value: kind,
                    label: (
                      <>
                        {translate(`activity.filter.${kind}`)}
                        {count(n)}
                      </>
                    ),
                  },
                ]
          }),
        ]}
      />
    </div>
  )
}

export function ActivityHistorySection({
  history,
  className,
  filterable = false,
}: {
  history: ReturnType<typeof useActivityHistory>
  className?: string
  filterable?: boolean
}) {
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const loading = history.loading && history.rows.length === 0
  const settled = !history.failed && !loading
  const counts = useMemo(() => {
    const byKind = new Map<ActivityKind, number>()
    for (const row of history.rows) {
      const kind = activityKind(row.msg)
      byKind.set(kind, (byKind.get(kind) ?? 0) + 1)
    }
    return byKind
  }, [history.rows])
  const activeFilter = filter !== 'all' && (counts.get(filter) ?? 0) > 0 ? filter : 'all'
  const rows = useMemo(
    () =>
      activeFilter === 'all' ? history.rows : history.rows.filter((row) => activityKind(row.msg) === activeFilter),
    [activeFilter, history.rows]
  )
  const showFilter = filterable && counts.size > 1
  return (
    <BlurFade delay={0.1} className={cn('mb-8', className)}>
      <section id="activity" aria-labelledby="activity-title" className="scroll-mt-20">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              <h2 id="activity-title" className="flex items-center gap-2 text-base font-semibold">
                <HistoryIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                {translate('activity.title')}
              </h2>
            </CardTitle>
            {history.partial ? <CardDescription>{translate('activity.partial')}</CardDescription> : null}
            {settled && history.rows.length > 0 ? (
              <CardAction>
                <Badge variant="secondary" className="tabular-nums">
                  {history.rows.length}
                  {history.partial ? '+' : ''}
                </Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {history.failed ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground">
                <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                <p>{translate('activity.unavailable')}</p>
              </div>
            ) : loading ? (
              <ActivitySkeleton />
            ) : history.rows.length === 0 ? (
              <EmptyState outline={false} className="py-6" icon={<HistoryIcon />} title={translate('activity.empty')} />
            ) : (
              <>
                {showFilter ? (
                  <ActivityFilterBar
                    counts={counts}
                    total={history.rows.length}
                    value={activeFilter}
                    onChange={setFilter}
                  />
                ) : null}
                <HistoryTimeline
                  key={activeFilter}
                  rows={rows}
                  initialRows={filterable ? FULL_TIMELINE_ROWS : undefined}
                />
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </BlurFade>
  )
}
