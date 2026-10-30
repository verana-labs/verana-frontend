'use client'

import {
  ActivityIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  BanIcon,
  type LucideIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useState } from 'react'
import { translate } from '@/i18n/dataview'
import type { ActivityRow } from '@/lib/activity-history'
import { humanizeMsg, summarizeChanges } from '@/ui/corporation/activity'
import { formatDate } from '@/ui/corporation/shared'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/ui/participants/timeline'
import { Button } from '@/ui/shadcn/button'
import { shortenMiddle } from '@/util/util'

const INITIAL_ROWS = 8

export const ACTIVITY_KINDS = ['create', 'update', 'archive', 'revoke', 'other'] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

type Tone = { icon: LucideIcon; className: string }

export function activityKind(msg: string): ActivityKind {
  const name = msg.replace(/^Msg/, '')
  if (name.startsWith('Unarchive') || name.startsWith('Archive')) return 'archive'
  if (name.startsWith('Create') || name.startsWith('Add')) return 'create'
  if (name.startsWith('Revoke') || name.startsWith('Delete') || name.startsWith('Slash')) return 'revoke'
  if (name.startsWith('Update') || name.startsWith('Set') || name.startsWith('Renew') || name.startsWith('Increase'))
    return 'update'
  return 'other'
}

function toneOf(msg: string): Tone {
  const name = msg.replace(/^Msg/, '')
  if (name.startsWith('Unarchive')) return { icon: ArchiveRestoreIcon, className: 'bg-success/10 text-success' }
  if (name.startsWith('Archive')) return { icon: ArchiveIcon, className: 'bg-warning/10 text-warning' }
  if (name.startsWith('Create') || name.startsWith('Add'))
    return { icon: PlusIcon, className: 'bg-primary/10 text-primary' }
  if (name.startsWith('Revoke') || name.startsWith('Delete') || name.startsWith('Slash'))
    return { icon: BanIcon, className: 'bg-destructive/10 text-destructive' }
  if (name.startsWith('Update') || name.startsWith('Set'))
    return { icon: PencilIcon, className: 'bg-info/10 text-info' }
  if (name.startsWith('Renew') || name.startsWith('Increase'))
    return { icon: RefreshCwIcon, className: 'bg-info/10 text-info' }
  return { icon: ActivityIcon, className: 'bg-muted text-muted-foreground' }
}

export function HistoryTimeline({ rows, initialRows = INITIAL_ROWS }: { rows: ActivityRow[]; initialRows?: number }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rows : rows.slice(0, initialRows)
  const hiddenCount = rows.length - visible.length

  return (
    <>
      <Timeline>
        {visible.map((row) => {
          const { icon: Icon, className } = toneOf(row.msg)
          const summary = summarizeChanges(row.changes)
          return (
            <TimelineItem key={row.id}>
              <TimelineIndicator className={className}>
                <Icon />
              </TimelineIndicator>
              <TimelineSeparator />
              <TimelineHeader>
                <TimelineTitle>{humanizeMsg(row.msg)}</TimelineTitle>
              </TimelineHeader>
              <TimelineContent className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                <TimelineDate dateTime={row.timestamp} className="inline">
                  {formatDate(row.timestamp)}
                </TimelineDate>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {translate('activity.block')} {row.blockHeight}
                </span>
                {row.account ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono" title={row.account}>
                      {shortenMiddle(row.account, 20)}
                    </span>
                  </>
                ) : null}
              </TimelineContent>
              {summary.length > 0 ? (
                <ul className="mt-2 space-y-0.5 rounded-md border bg-muted/40 px-2 py-1.5 font-mono text-[11px]">
                  {summary.map((line) => {
                    const split = line.indexOf(': ')
                    const key = split < 0 ? line : line.slice(0, split)
                    const value = split < 0 ? '' : line.slice(split + 2)
                    return (
                      <li key={line} className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-muted-foreground" title={key}>
                          {key}
                        </span>
                        {value ? (
                          <>
                            <span className="sr-only">: </span>
                            <span className="shrink-0 text-foreground tabular-nums">{value}</span>
                          </>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </TimelineItem>
          )
        })}
      </Timeline>
      {hiddenCount > 0 ? (
        <Button variant="ghost" size="sm" className="mt-3 ms-8 text-primary" onClick={() => setExpanded(true)}>
          {translate('activity.showOlder', { count: hiddenCount })}
        </Button>
      ) : null}
    </>
  )
}
