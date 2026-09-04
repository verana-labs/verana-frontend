'use client'

import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { KindBadges, membershipDisplayName, useMembershipNames } from '@/ui/common/corporation-selector'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag, shortenMiddle } from '@/util/util'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function AccountCorporations() {
  const router = useRouter()
  const { memberships, acting, loading, setActing } = useUserCorporation()
  const names = useMembershipNames(memberships)

  function openCorporation(membership: CorporationMembership) {
    setActing(membership.corporation.id)
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
          {memberships.map((membership) => {
            const did = membership.corporation.did
            const name = membershipDisplayName(membership, names)
            const countryCode = names[did]?.countryCode
            const flag = countryCode ? countryCodeToFlag(countryCode) : null
            const isActing = acting?.corporation.id === membership.corporation.id
            return (
              <li key={membership.corporation.id}>
                <button
                  type="button"
                  onClick={() => openCorporation(membership)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-muted dark:hover:bg-neutral-70/30 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      {flag ? <span aria-hidden="true">{flag}</span> : null}
                      <span className="truncate font-medium text-gray-900 dark:text-white">
                        {name ?? shortenMiddle(did, 34)}
                      </span>
                      {isActing ? (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300">
                          {t('account.corporations.acting')}
                        </span>
                      ) : null}
                    </span>
                    {name ? (
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{did}</span>
                    ) : null}
                    <span className="block mt-1">
                      <KindBadges
                        operator={membership.operator}
                        member={membership.member}
                        weight={membership.weight}
                      />
                    </span>
                  </span>
                  <FontAwesomeIcon icon={faChevronRight} className="shrink-0 text-xs text-gray-400" />
                </button>
              </li>
            )
          })}
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
