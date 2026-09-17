'use client'

import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { CorporationDiscoveryFailure } from '@/ui/common/corporation-discovery-failure'
import { CorporationMembershipRow } from '@/ui/common/corporation-membership-row'

export function AccountCorporations() {
  const router = useRouter()
  const { memberships, actingCorporation, loading, error, attention, setActingCorporation } = useUserCorporation()

  function openCorporation(membership: CorporationMembership) {
    setActingCorporation(membership.corporation.id)
    router.push('/corporation')
  }

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <h3 className="data-view-section-title text-lg mb-4">{translate('account.corporations.title')}</h3>
      <CorporationDiscoveryFailure />
      {loading && memberships.length === 0 ? (
        <div className="h-14 rounded-lg bg-surface-muted dark:bg-neutral-70/20 animate-pulse" />
      ) : null}
      {!loading && !error && memberships.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{translate('account.corporations.empty')}</p>
      ) : null}
      {memberships.length > 0 ? (
        <ul className="rounded-lg border border-neutral-20 dark:border-neutral-70 divide-y divide-neutral-20 dark:divide-neutral-70 overflow-hidden">
          {memberships.map((membership) => {
            const isActing = actingCorporation?.corporation.id === membership.corporation.id
            return (
              <li key={membership.corporation.id}>
                <button
                  type="button"
                  aria-current={isActing ? 'true' : undefined}
                  onClick={() => openCorporation(membership)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-muted dark:hover:bg-neutral-70/30 transition-colors"
                >
                  <CorporationMembershipRow
                    membership={membership}
                    isActing={isActing}
                    attention={attention[membership.corporation.id]}
                  />
                  <FontAwesomeIcon icon={faChevronRight} className="shrink-0 text-xs text-gray-400" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {translate('account.corporations.notice')}{' '}
        <Link
          href="/corporation"
          className="font-medium text-primary-700 dark:text-primary-300 underline underline-offset-2"
        >
          {translate('account.corporations.notice.link')}
        </Link>
      </p>
    </div>
  )
}
