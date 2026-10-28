'use client'

import { ArrowRightIcon, InboxIcon, LoaderCircleIcon, RotateCwIcon, TriangleAlertIcon, VoteIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { INDEXER_MAX_LIMIT } from '@/lib/indexer-json'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'
import { BlurFade } from '@/ui/motion/blur-fade'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

type PendingTasksInboxProps = {
  ecosystems: PendingEcosystem[]
  pendingVotes: number
  partial: boolean
  settled: boolean
  error: string | null
  onRetry: () => void
}

function VotesCallout({ count }: { count: number }) {
  return (
    <BlurFade className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-primary/5 py-2 ps-2.5 pe-2 ring-1 ring-primary/15 dark:bg-primary/10">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <VoteIcon aria-hidden="true" className="size-3.5" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{translate('task.votes.pending', { count })}</p>
      <Button asChild size="sm" variant="ghost" className="text-primary hover:text-primary">
        <Link href="/corporation?tab=proposals">
          {translate('task.votes.open')}
          <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
        </Link>
      </Button>
    </BlurFade>
  )
}

function SummaryStats({ ecosystems, partial }: { ecosystems: PendingEcosystem[]; partial: boolean }) {
  const tasks = ecosystems.reduce((sum, ecosystem) => sum + ecosystem.pending_tasks, 0)
  const schemas = ecosystems.reduce((sum, ecosystem) => sum + ecosystem.schemas.length, 0)
  const suffix = partial ? '+' : ''
  const format = (value: number) => `${Math.round(value).toLocaleString()}${suffix}`
  const stats: [string, number][] = [
    ['task.summary.tasks', tasks],
    ['task.summary.ecosystems', ecosystems.length],
    ['task.summary.schemas', schemas],
  ]
  return (
    <Stagger
      as="ul"
      className="mb-3 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg bg-muted/40 ring-1 ring-border rtl:divide-x-reverse dark:bg-muted/30"
    >
      {stats.map(([key, value]) => (
        <StaggerItem as="li" key={key} className="flex min-w-0 flex-col gap-1 px-3 py-2.5 sm:px-4 sm:py-3">
          <NumberTicker
            value={value}
            format={format}
            className="text-xl leading-none font-semibold tracking-tight text-foreground sm:text-2xl"
          />
          <span className="text-xs leading-snug text-muted-foreground">{translate(key)}</span>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3 p-2">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
        {translate('task.tree.loading')}
      </p>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3" style={{ paddingInlineStart: `${row * 24}px` }}>
          <Shimmer className="size-4 rounded-sm" />
          <Shimmer className="h-4 w-48 max-w-[60%]" />
          <Shimmer className="h-4 w-8 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function PendingTasksInbox({
  ecosystems,
  pendingVotes,
  partial,
  settled,
  error,
  onRetry,
}: PendingTasksInboxProps) {
  const votes = pendingVotes > 0 ? <VotesCallout count={pendingVotes} /> : null
  if (error)
    return (
      <>
        {votes}
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-lg border border-warning/30 bg-warning/10 py-2 ps-4 pe-2 text-sm text-warning dark:bg-warning/15"
        >
          <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
          <p className="min-w-0 flex-1">{translate('task.tree.error')}</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <RotateCwIcon aria-hidden="true" />
            {translate('participants.tree.retry')}
          </Button>
        </div>
      </>
    )
  if (partial || ecosystems.length > 0)
    return (
      <>
        {votes}
        <SummaryStats ecosystems={ecosystems} partial={partial} />
        {partial ? (
          <p className="mb-2 px-2 text-xs text-muted-foreground">
            {translate('task.tree.partial', { count: INDEXER_MAX_LIMIT })}
          </p>
        ) : null}
      </>
    )
  if (!settled)
    return (
      <>
        {votes}
        <LoadingRows />
      </>
    )
  return (
    <>
      {votes}
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-success/10 text-success">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>{translate('task.tree.empty')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </>
  )
}
