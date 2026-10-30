import { getLocale } from '@/i18n/dataview'
import type { DeltaPillProps } from '@/ui/common/delta-pill'

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString(getLocale())
}

export function formatCompact(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(getLocale(), { notation: 'compact', maximumFractionDigits }).format(value)
}

export function relativeTime(timestamp: string | null, now = Date.now()): string {
  if (!timestamp) return ''
  const format = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto', style: 'short' })
  const seconds = Math.round((new Date(timestamp).getTime() - now) / 1000)
  if (Math.abs(seconds) < 60) return format.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return format.format(hours, 'hour')
  return format.format(Math.round(hours / 24), 'day')
}

export function periodDelta(current: number, previous: number, label?: string): DeltaPillProps | null {
  if (previous <= 0) return null
  const change = Math.round(((current - previous) / previous) * 100)
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const size = Math.abs(change)
  return { trend, value: `${size > 999 ? '>999' : formatCount(size)}%`, label }
}
