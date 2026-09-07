'use client'

import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { translate } from '@/i18n/dataview'
import type { CorporationAttention } from '@/lib/corporation-attention'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { DidEnrichment } from '@/lib/resolverClient'
import { countryCodeToFlag } from '@/util/util'

export function corporationDisplayName(enrichment: DidEnrichment | null): string | null {
  return enrichment?.organizationName ?? enrichment?.serviceName ?? null
}

function AttentionBadge({ count, label, className }: { count: number; label: string; className: string }) {
  if (count === 0) return null
  return (
    <span
      title={label}
      aria-label={`${count} ${label}`}
      className={`min-w-5 h-5 px-1 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none ${className}`}
    >
      {count}
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
  const { data } = useDidTrustEnrichment(corporation.did)
  const name = corporationDisplayName(data)
  const flag = name && data?.countryCode ? countryCodeToFlag(data.countryCode) : null

  return (
    <>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          {flag ? <span aria-hidden="true">{flag}</span> : null}
          <span className="break-all font-medium text-gray-900 dark:text-white">{name ?? corporation.did}</span>
          {isActing ? <FontAwesomeIcon icon={faCheck} className="text-primary-600 shrink-0" /> : null}
        </span>
        {name ? (
          <span className="block break-all text-xs text-gray-500 dark:text-gray-400">{corporation.did}</span>
        ) : null}
        <span className="flex items-center gap-1">
          {operator ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {translate('corporation.selector.operator')}
            </span>
          ) : null}
          {member ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-20 text-gray-700 dark:bg-neutral-70 dark:text-gray-200">
              {translate('corporation.selector.member')}
              {weight ? ` ×${weight}` : ''}
            </span>
          ) : null}
        </span>
      </span>
      {isActing || !attention ? null : (
        <span className="flex items-center gap-1">
          <AttentionBadge
            count={attention.pendingTasks}
            label={translate('corporation.selector.pendingtasks')}
            className="bg-amber-500"
          />
          <AttentionBadge
            count={attention.pendingVotes}
            label={translate('corporation.selector.pendingvotes')}
            className="bg-red-500"
          />
        </span>
      )}
    </>
  )
}
