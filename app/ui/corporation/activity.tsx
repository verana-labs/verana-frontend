'use client'

import type { ActivityRow } from '@/hooks/useCorporationDetails'
import { shortenMiddle } from '@/util/util'
import { formatDate, t } from './shared'

const SUMMARY_KEYS = ['did', 'grantee', 'operator', 'amount', 'slashed', 'repaid', 'threshold', 'language'] as const

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
  if (visible.length === 0) return <p className="text-sm text-gray-500">{t('corporation.page.activity.empty')}</p>
  return (
    <ol className="relative border-l border-neutral-20 dark:border-neutral-70 ml-2 space-y-4">
      {visible.map((row) => {
        const summary = summarizeChanges(row.changes)
        return (
          <li key={row.id} className="ml-4">
            <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">{humanizeMsg(row.msg)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(row.timestamp)} · {t('corporation.page.block')} {row.blockHeight}
              {row.account ? ` · ${shortenMiddle(row.account, 20)}` : ''}
            </p>
            {summary.length > 0 ? (
              <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">{summary.join(' · ')}</p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
