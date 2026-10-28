'use client'

import { CheckIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import type { CorporationAttention } from '@/lib/corporation-attention'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { DidEnrichment } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import { atLeast, nameInitials } from '@/ui/corporation/shared'
import { countryCodeToFlag } from '@/util/util'

export function corporationDisplayName(enrichment: DidEnrichment | null | undefined): string | null {
  return enrichment?.organizationName ?? enrichment?.serviceName ?? null
}

function AttentionBadge({
  count,
  partial,
  label,
  className,
}: {
  count: number
  partial: boolean
  label: string
  className: string
}) {
  if (count === 0) return null
  const shown = atLeast(count, partial)
  return (
    <span
      title={label}
      aria-label={`${shown} ${label}`}
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-semibold tabular-nums',
        className
      )}
    >
      {shown}
    </span>
  )
}

export function CorporationMembershipRow({
  membership,
  isActing,
  attention,
}: {
  membership: CorporationMembership
  isActing: boolean
  attention: CorporationAttention | undefined
}) {
  const { corporation, operator, member, weight } = membership
  const data = corporation.trustData
  const name = corporationDisplayName(data)
  const flag = name && data?.countryCode ? countryCodeToFlag(data.countryCode) : null

  return (
    <>
      <span className="flex min-w-0 items-start gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ring-1',
            isActing ? 'bg-primary text-primary-foreground ring-primary' : 'bg-primary/10 text-primary ring-primary/15'
          )}
        >
          {nameInitials(name ?? corporation.did)}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            {flag ? <span aria-hidden="true">{flag}</span> : null}
            <span className="font-medium break-all text-foreground">{name ?? corporation.did}</span>
            {isActing ? <CheckIcon aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
          </span>
          {name ? <span className="block text-xs break-all text-muted-foreground">{corporation.did}</span> : null}
          <span className="mt-1 flex flex-wrap items-center gap-1">
            {operator ? (
              <span className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-primary uppercase">
                {translate('corporation.selector.operator')}
              </span>
            ) : null}
            {member ? (
              <span className="rounded-md border border-border bg-muted px-1.5 py-px text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {translate('corporation.selector.member')}
                {weight ? ` ×${weight}` : ''}
              </span>
            ) : null}
          </span>
        </span>
      </span>
      {isActing || !attention ? null : (
        <span className="ms-auto flex shrink-0 items-center gap-1">
          <AttentionBadge
            count={attention.pendingTasks}
            partial={attention.pendingTasksPartial}
            label={translate('corporation.selector.pendingtasks')}
            className="bg-warning/15 text-warning ring-1 ring-warning/30"
          />
          <AttentionBadge
            count={attention.pendingVotes}
            partial={attention.pendingVotesPartial}
            label={translate('corporation.selector.pendingvotes')}
            className="bg-destructive text-white dark:text-neutral-950"
          />
        </span>
      )}
    </>
  )
}
