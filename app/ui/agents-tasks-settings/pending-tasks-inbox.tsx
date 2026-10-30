'use client'

import {
  ArrowRightIcon,
  CheckCheckIcon,
  FileTextIcon,
  GlobeIcon,
  InfoIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  type LucideIcon,
  RotateCwIcon,
  TriangleAlertIcon,
  VoteIcon,
} from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { INDEXER_MAX_LIMIT } from '@/lib/indexer-json'
import { cn } from '@/lib/utils'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'
import { BlurFade } from '@/ui/motion/blur-fade'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'

type PendingTasksInboxProps = {
  ecosystems: PendingEcosystem[]
  pendingVotes: number
  partial: boolean
  settled: boolean
  error: string | null
  onRetry: () => void
}

const GHOST_ROWS = [
  { id: 'a', depth: 0, width: 'w-28 sm:w-44' },
  { id: 'b', depth: 1, width: 'w-32 sm:w-56' },
  { id: 'c', depth: 2, width: 'w-24 sm:w-40' },
  { id: 'd', depth: 2, width: 'w-28 sm:w-52' },
  { id: 'e', depth: 1, width: 'w-20 sm:w-36' },
  { id: 'f', depth: 2, width: 'w-24 sm:w-48' },
]

const SKELETON_TILES = ['tasks', 'ecosystems', 'schemas']

function VotesCallout({ count }: { count: number }) {
  return (
    <BlurFade className="relative isolate mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-xl bg-tint-accent py-2.5 ps-3 pe-2 ring-1 ring-primary/15">
      <DotPattern
        width={14}
        height={14}
        className="-z-10 text-primary/25 [mask-image:linear-gradient(to_left,white,transparent_60%)] rtl:[mask-image:linear-gradient(to_right,white,transparent_60%)]"
      />
      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-hairline">
        <VoteIcon aria-hidden="true" className="size-4" />
        <span
          aria-hidden="true"
          className="pulse-dot absolute motion-reduce:before:hidden -end-0.5 -top-0.5 size-2 rounded-full bg-primary"
        />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{translate('task.votes.pending', { count })}</p>
      <Button asChild size="sm" variant="ghost" className="text-primary hover:bg-card/70 hover:text-primary">
        <Link href="/corporation?tab=proposals">
          {translate('task.votes.open')}
          <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
        </Link>
      </Button>
    </BlurFade>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  format,
  highlight,
}: {
  icon: LucideIcon
  label: string
  value: number
  format: (value: number) => string
  highlight: boolean
}) {
  return (
    <StaggerItem
      as="li"
      className="group relative isolate flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-xl bg-card p-3 shadow-hairline sm:p-4"
    >
      {highlight ? (
        <DotPattern
          width={14}
          height={14}
          className="-z-10 text-primary/25 [mask-image:radial-gradient(140px_circle_at_top_right,white,transparent)]"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-lg bg-tint-accent text-primary transition-transform duration-(--duration-slow) ease-emphasized group-hover:scale-90 motion-reduce:transition-none sm:size-8"
      >
        <Icon className="size-3.5 sm:size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <NumberTicker
          value={value}
          format={format}
          className="text-xl leading-none font-semibold tracking-[-0.025em] text-foreground tabular-nums sm:text-[28px]"
        />
        <span title={label} className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {label}
        </span>
      </div>
    </StaggerItem>
  )
}

function SummaryStats({ ecosystems, partial }: { ecosystems: PendingEcosystem[]; partial: boolean }) {
  const tasks = ecosystems.reduce((sum, ecosystem) => sum + ecosystem.pending_tasks, 0)
  const schemas = ecosystems.reduce((sum, ecosystem) => sum + ecosystem.schemas.length, 0)
  const suffix = partial ? '+' : ''
  const format = (value: number) => `${Math.round(value).toLocaleString()}${suffix}`
  const stats: [string, number, LucideIcon][] = [
    ['task.summary.tasks', tasks, ListChecksIcon],
    ['task.summary.ecosystems', ecosystems.length, GlobeIcon],
    ['task.summary.schemas', schemas, FileTextIcon],
  ]
  return (
    <Stagger as="ul" className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map(([key, value, icon], index) => (
        <SummaryTile
          key={key}
          icon={icon}
          label={translate(key)}
          value={value}
          format={format}
          highlight={index === 0}
        />
      ))}
    </Stagger>
  )
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3 p-2">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin text-primary" />
        {translate('task.tree.loading')}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {SKELETON_TILES.map((key) => (
          <div key={key} className="flex flex-col gap-2.5 rounded-xl bg-card p-3 shadow-hairline sm:p-4">
            <Shimmer className="size-7 rounded-lg sm:size-8" />
            <Shimmer className="h-6 w-12" />
            <Shimmer className="h-3 w-20 max-w-full" />
          </div>
        ))}
      </div>
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

function GhostTree() {
  return (
    <div className="flex w-full flex-col gap-3.5 p-5 max-sm:[mask-image:radial-gradient(ellipse_75%_55%_at_center,transparent_35%,black_85%)]">
      {GHOST_ROWS.map(({ id, depth, width }) => (
        <div key={id} className="flex items-center gap-2.5" style={{ paddingInlineStart: `${depth * 28}px` }}>
          <span className="size-4 shrink-0 rounded-sm bg-primary" />
          <span className={cn('h-3 max-w-[60%] rounded-full bg-foreground', width)} />
          <span className="h-3 w-8 shrink-0 rounded-full bg-primary" />
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
          className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-tint-warning py-2.5 ps-3 pe-2 text-sm text-warning ring-1 ring-warning/25"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-hairline">
            <TriangleAlertIcon aria-hidden="true" className="size-4" />
          </span>
          <p className="min-w-0 flex-1 font-medium">{translate('task.tree.error')}</p>
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
          <p className="mb-2 flex items-start gap-2 rounded-lg bg-tint-info px-3 py-2 text-xs text-foreground">
            <InfoIcon aria-hidden="true" className="mt-px size-3.5 shrink-0 text-info" />
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
      <GhostEmpty
        className="mb-2 min-h-56 overflow-hidden rounded-xl border border-dashed border-border"
        icon={<CheckCheckIcon className="text-success" />}
        title={translate('task.tree.empty')}
      >
        <GhostTree />
      </GhostEmpty>
    </>
  )
}
