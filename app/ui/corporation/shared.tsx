'use client'

import { InfoIcon, TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/shadcn/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'

export function Card({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('min-w-0 scroll-mt-20 rounded-xl bg-card p-5 shadow-card sm:p-6', className)}>
      {children}
    </section>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-base font-semibold tracking-tight text-foreground', className)}>{children}</h2>
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4.5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 space-y-1">
          <SectionTitle>{title}</SectionTitle>
          {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function SectionUnavailable() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
      <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {translate('corporation.page.section.error')}
    </p>
  )
}

export function PartialNote({ filtered = false }: { filtered?: boolean }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <InfoIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {translate(filtered ? 'pagination.loadedOnly' : 'pagination.truncated')}
    </p>
  )
}

export function atLeast(count: number, partial: boolean): string {
  return partial ? `${count}+` : String(count)
}

export function Fact({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-words text-foreground tabular-nums">{value}</p>
    </div>
  )
}

export function formatDate(value: string | null): string {
  if (!value) return translate('common.none')
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
  return translate(minutes >= 0 ? 'corporation.time.in' : 'corporation.time.ago', { value: unit })
}

export const STATUS_TONE: Record<string, { badge: string; dot: string }> = {
  SUBMITTED: { badge: 'border-info/25 bg-info/10 text-info', dot: 'bg-info' },
  ACCEPTED: { badge: 'border-success/25 bg-success/10 text-success', dot: 'bg-success' },
  REJECTED: { badge: 'border-destructive/25 bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  ABORTED: { badge: 'border-warning/25 bg-warning/10 text-warning', dot: 'bg-warning' },
  WITHDRAWN: { badge: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
}

const STATUS_KEYS: Record<string, string> = {
  SUBMITTED: 'corporation.proposals.filter.open',
  ACCEPTED: 'corporation.proposals.filter.accepted',
  REJECTED: 'corporation.proposals.filter.rejected',
  ABORTED: 'corporation.proposals.filter.aborted',
  WITHDRAWN: 'corporation.proposals.filter.withdrawn',
}

export function statusLabel(status: string): string {
  return STATUS_KEYS[status] ? translate(STATUS_KEYS[status]) : status
}

const AWAITING_TALLY_TONE = { badge: 'border-border bg-muted text-muted-foreground', dot: 'bg-info' }

export function StatusBadge({ status, votingEnded = false }: { status: string; votingEnded?: boolean }) {
  const awaiting = status === 'SUBMITTED' && votingEnded
  const tone = awaiting ? AWAITING_TALLY_TONE : (STATUS_TONE[status] ?? STATUS_TONE.WITHDRAWN)
  const badge = (
    <Badge variant="outline" className={cn('gap-1.5', tone.badge)}>
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', tone.dot)} />
      {awaiting ? translate('corporation.proposals.status.awaitingtally') : statusLabel(status)}
    </Badge>
  )
  if (status !== 'ABORTED') return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="relative inline-flex cursor-default rounded-4xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {badge}
        </button>
      </TooltipTrigger>
      <TooltipContent>{translate('corporation.proposals.aborted.hint')}</TooltipContent>
    </Tooltip>
  )
}

export function YouBadge() {
  return (
    <Badge
      variant="outline"
      className="h-4.5 border-primary/25 bg-primary/10 px-1.5 text-[10px] tracking-wide text-primary uppercase"
    >
      {translate('corporation.page.you')}
    </Badge>
  )
}

export function addressInitials(address: string): string {
  return address
    .replace(/^verana1/, '')
    .slice(0, 2)
    .toUpperCase()
}

export function nameInitials(name: string): string {
  const words = name
    .replace(/^did:[^:]+:/, '')
    .split(/[\s.:_-]+/)
    .filter(Boolean)
  const letters = words.length > 1 ? `${words[0][0]}${words[1][0]}` : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}
