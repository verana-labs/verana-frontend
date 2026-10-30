'use client'

import {
  ActivityIcon,
  ArchiveIcon,
  BanIcon,
  CoinsIcon,
  HistoryIcon,
  KeyRoundIcon,
  type LucideIcon,
  PencilIcon,
  PlusIcon,
  ShieldAlertIcon,
  VoteIcon,
} from 'lucide-react'
import { translate } from '@/i18n/dataview'
import type { ActivityRow } from '@/lib/activity-history'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/ui/common/empty-state'
import { TONE_CLASSES, type Tone, ToneTag } from '@/ui/common/tone-tag'
import { relativeTime } from '@/ui/dashboard/format'
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

const MSG_TONES: { pattern: RegExp; tone: Tone; icon: LucideIcon }[] = [
  { pattern: /^(Msg)?(Repay)/, tone: 'success', icon: CoinsIcon },
  { pattern: /^(Msg)?(Slash)/, tone: 'destructive', icon: ShieldAlertIcon },
  { pattern: /^(Msg)?(Revoke|Withdraw)/, tone: 'destructive', icon: BanIcon },
  { pattern: /^(Msg)?(Archive)/, tone: 'warning', icon: ArchiveIcon },
  { pattern: /^(Msg)?(Grant)/, tone: 'accent', icon: KeyRoundIcon },
  { pattern: /^(Msg)?(SubmitProposal|Vote|Exec)/, tone: 'info', icon: VoteIcon },
  { pattern: /^(Msg)?(Create|Add|Store)/, tone: 'success', icon: PlusIcon },
  { pattern: /^(Msg)?(Update|Increase|Set|Rotate)/, tone: 'accent', icon: PencilIcon },
]

function msgTone(msg: string): { tone: Tone; icon: LucideIcon } {
  return MSG_TONES.find((entry) => entry.pattern.test(msg)) ?? { tone: 'neutral', icon: ActivityIcon }
}

export function ActivityTimeline({ rows, limit }: { rows: ActivityRow[]; limit?: number }) {
  const visible = limit ? rows.slice(0, limit) : rows
  if (visible.length === 0) {
    return <EmptyState icon={<HistoryIcon />} title={translate('activity.empty')} className="py-8" />
  }
  return (
    <Timeline>
      {visible.map((row) => {
        const summary = summarizeChanges(row.changes)
        const { tone, icon: Icon } = msgTone(row.msg)
        const relative = Number.isNaN(Date.parse(row.timestamp)) ? '' : relativeTime(row.timestamp)
        return (
          <TimelineItem key={row.id} className="ms-10 pb-5">
            <TimelineIndicator className={cn('top-0 -start-10 size-7 rounded-lg border-0', TONE_CLASSES[tone])}>
              <Icon className="size-3.5!" />
            </TimelineIndicator>
            <TimelineSeparator className="top-8 -start-[1.625rem] h-[calc(100%-2.25rem)]" />
            <div className="flex flex-col gap-x-3 gap-y-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-0.5">
                <TimelineTitle className="leading-6">{humanizeMsg(row.msg)}</TimelineTitle>
                <TimelineDate>
                  {relative ? <>{relative} · </> : null}
                  <time dateTime={row.timestamp}>{formatDate(row.timestamp)}</time>
                  {row.account ? <span className="font-mono"> · {shortenMiddle(row.account, 20)}</span> : null}
                </TimelineDate>
              </div>
              <ToneTag className="w-fit shrink-0 font-mono tabular-nums">
                {translate('activity.block')} {row.blockHeight}
              </ToneTag>
            </div>
            {summary.length > 0 ? (
              <TimelineContent className="mt-1.5 w-fit max-w-full rounded-md bg-tint-neutral px-2 py-1 font-mono break-all">
                {summary.join(' · ')}
              </TimelineContent>
            ) : null}
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
