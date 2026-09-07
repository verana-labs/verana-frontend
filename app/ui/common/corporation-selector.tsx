'use client'

import { useChain } from '@cosmos-kit/react'
import { faBuilding, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useDidTrustEnrichment } from '@/hooks/useDidTrustEnrichment'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { CorporationMembershipRow, corporationDisplayName } from '@/ui/common/corporation-membership-row'

export function CorporationSelector() {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const { memberships, actingCorporation, needsSelection, loading, error, attention, setActingCorporation } =
    useUserCorporation()
  const { data: actingEnrichment } = useDidTrustEnrichment(actingCorporation?.corporation.did)

  if (!isWalletConnected || loading) return null

  const label = actingCorporation
    ? (corporationDisplayName(actingEnrichment) ?? actingCorporation.corporation.did)
    : translate(needsSelection ? 'corporation.selector.choose' : 'corporation.selector.none')

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium max-w-56 ${
          needsSelection
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
            : 'bg-surface-muted dark:bg-surface-muted text-gray-800 dark:text-gray-100'
        }`}
      >
        <FontAwesomeIcon icon={faBuilding} className="text-primary-600 dark:text-primary-400" />
        <span className="truncate" title={actingCorporation?.corporation.did}>
          {label}
        </span>
        {error ? (
          <span
            title={error}
            className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold uppercase tracking-wide dark:bg-red-900/40 dark:text-red-300"
          >
            {translate('corporation.selector.error')}
          </span>
        ) : null}
        <FontAwesomeIcon icon={faChevronDown} className="text-xs opacity-60" />
      </MenuButton>
      <MenuItems className="absolute right-0 z-30 mt-2 w-80 origin-top-right rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface shadow-lg focus:outline-none p-1">
        <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {translate('corporation.selector.title')}
        </p>
        {memberships.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
            {translate('corporation.selector.empty')}
          </p>
        ) : null}
        {memberships.map((membership) => (
          <MenuItem key={membership.corporation.id}>
            <button
              type="button"
              onClick={() => setActingCorporation(membership.corporation.id)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm data-[focus]:bg-surface-muted dark:data-[focus]:bg-neutral-70/30"
            >
              <CorporationMembershipRow
                membership={membership}
                isActing={actingCorporation?.corporation.id === membership.corporation.id}
                attention={attention[membership.corporation.id]}
              />
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
