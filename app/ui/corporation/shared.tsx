'use client'

import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'

export function t(key: string, values?: Record<string, string | number>): string {
  return translate(key, values)
}

export function Card({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className={`rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 ${className ?? ''}`}
    >
      {children}
    </section>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-white">{children}</h2>
}

export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white break-all">{value}</p>
    </div>
  )
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export function formatRelative(value: string | null, now: number = Date.now()): string | null {
  if (!value) return null
  const target = new Date(value).getTime()
  if (Number.isNaN(target)) return null
  const minutes = Math.round((target - now) / 60_000)
  const distance = Math.abs(minutes)
  const unit =
    distance >= 1440
      ? `${Math.round(distance / 1440)}d`
      : distance >= 60
        ? `${Math.round(distance / 60)}h`
        : `${distance}m`
  return t(minutes >= 0 ? 'corporation.time.in' : 'corporation.time.ago', { value: unit })
}

const STATUS_CLASSES: Record<string, string> = {
  SUBMITTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  ACCEPTED: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  WITHDRAWN: 'bg-neutral-20 text-gray-700 dark:bg-neutral-70 dark:text-gray-200',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_CLASSES[status] ?? STATUS_CLASSES.WITHDRAWN}`}>
      {status}
    </span>
  )
}

export function YouBadge() {
  return (
    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
      {t('corporation.page.you')}
    </span>
  )
}
