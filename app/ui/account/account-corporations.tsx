'use client'

import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { CorporationMembershipRow } from '@/ui/common/corporation-membership-row'
import { resolveTranslatable } from '@/ui/dataview/types'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function AccountCorporations() {
  const router = useRouter()
  const { memberships, actingCorporation, loading, attention, setActingCorporation } = useUserCorporation()

  function openCorporation(membership: CorporationMembership) {
    setActingCorporation(membership.corporation.id)
    router.push('/corporation')
  }

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <h3 className="data-view-section-title text-lg mb-4">{t('account.corporations.title')}</h3>
      {loading ? (
        <div className="h-14 rounded-lg bg-surface-muted dark:bg-neutral-70/20 animate-pulse" />
      ) : memberships.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.corporations.empty')}</p>
      ) : (
        <ul className="rounded-lg border border-neutral-20 dark:border-neutral-70 divide-y divide-neutral-20 dark:divide-neutral-70 overflow-hidden">
          {memberships.map((membership) => (
            <li key={membership.corporation.id}>
              <button
                type="button"
                onClick={() => openCorporation(membership)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-muted dark:hover:bg-neutral-70/30 transition-colors"
              >
                <CorporationMembershipRow
                  membership={membership}
                  isActing={actingCorporation?.corporation.id === membership.corporation.id}
                  attention={attention[membership.corporation.id]}
                />
                <FontAwesomeIcon icon={faChevronRight} className="shrink-0 text-xs text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {t('account.corporations.notice')}{' '}
        <Link
          href="/corporation"
          className="font-medium text-primary-700 dark:text-primary-300 underline underline-offset-2"
        >
          {t('account.corporations.notice.link')}
        </Link>
      </p>
    </div>
  )
}
