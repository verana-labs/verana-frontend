'use client'

import { HistoryIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import type { ActivityRow } from '@/lib/activity-history'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'
import { shortenMiddle } from '@/util/util'
import { formatDate } from './shared'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from './timeline'

const SUMMARY_KEYS = [
  'title',
  'did',
  'grantee',
  'operator',
  'amount',
  'slashed',
  'repaid',
  'threshold',
  'language',
  'active_version',
  'archived',
  'issuer_grantor_validation_validity_period',
  'verifier_grantor_validation_validity_period',
  'issuer_validation_validity_period',
  'verifier_validation_validity_period',
  'holder_validation_validity_period',
] as const

export function humanizeMsg(msg: string): string {
  return msg.replace(/^Msg/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function summarizeChanges(changes: Record<string, unknown>): string[] {
  return SUMMARY_KEYS.flatMap((key) => {
    const value = changes[key]
    if (typeof value !== 'string' && typeof value !== 'number') return []
    const text = typeof value === 'string' && value.length > 30 ? shortenMiddle(value, 30) : String(value)
    return [`${key}: ${text}`]
  })
}

export function ActivityTimeline({ rows, limit }: { rows: ActivityRow[]; limit?: number }) {
  const visible = limit ? rows.slice(0, limit) : rows
  if (visible.length === 0) {
    return (
      <Empty className="border border-dashed border-border py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle className="font-normal text-muted-foreground">{translate('activity.empty')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <Timeline>
      {visible.map((row) => {
        const summary = summarizeChanges(row.changes)
        return (
          <TimelineItem key={row.id}>
            <TimelineIndicator />
            <TimelineSeparator />
            <div className="flex flex-col gap-x-3 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <TimelineTitle>{humanizeMsg(row.msg)}</TimelineTitle>
              <TimelineDate className="shrink-0">
                {formatDate(row.timestamp)} · {translate('activity.block')} {row.blockHeight}
                {row.account ? ` · ${shortenMiddle(row.account, 20)}` : ''}
              </TimelineDate>
            </div>
            {summary.length > 0 ? (
              <TimelineContent className="mt-1 w-fit max-w-full rounded-md bg-muted px-2 py-1 font-mono break-all">
                {summary.join(' · ')}
              </TimelineContent>
            ) : null}
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
