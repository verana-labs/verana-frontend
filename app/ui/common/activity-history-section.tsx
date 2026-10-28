'use client'

import { HistoryIcon, TriangleAlertIcon } from 'lucide-react'
import type { useActivityHistory } from '@/hooks/useActivityHistory'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/ui/common/empty-state'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Shimmer } from '@/ui/motion/shimmer'
import { HistoryTimeline } from '@/ui/participants/history-timeline'
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

export function ActivityHistorySection({
  history,
  className,
}: {
  history: ReturnType<typeof useActivityHistory>
  className?: string
}) {
  const loading = history.loading && history.rows.length === 0
  const settled = !history.failed && !loading
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
              <HistoryTimeline rows={history.rows} />
            )}
          </CardContent>
        </Card>
      </section>
    </BlurFade>
  )
}
