'use client'

import { useChain } from '@cosmos-kit/react'
import { faBuilding, faCheck, faChevronDown, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { type CorporationAttention, useCorporationAttention } from '@/hooks/useCorporationAttention'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { type CorporationMembership, operatorOnlyMode } from '@/lib/corporation-discovery'
import { logger } from '@/lib/logger'
import { type DidEnrichment, fetchDidEnrichment } from '@/lib/resolverClient'
import { useCorporationContext } from '@/providers/corporation-provider'
import { resolveTranslatable } from '@/ui/dataview/types'
import { countryCodeToFlag, shortenMiddle } from '@/util/util'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function useMembershipNames(memberships: CorporationMembership[]): Record<string, DidEnrichment> {
  const [names, setNames] = useState<Record<string, DidEnrichment>>({})
  const dids = memberships.map((membership) => membership.corporation.did).join(',')

  useEffect(() => {
    if (!dids) {
      setNames({})
      return
    }
    let cancelled = false
    void Promise.all(
      dids.split(',').map(async (did) => {
        try {
          return [did, await fetchDidEnrichment(did)] as const
        } catch (error) {
          logger.error('corporation name resolution', error)
          return [did, { did, trustStatus: 'UNRESOLVED' } as DidEnrichment] as const
        }
      })
    ).then((entries) => {
      if (!cancelled) setNames(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [dids])

  return names
}

export function membershipDisplayName(
  membership: CorporationMembership,
  names: Record<string, DidEnrichment>
): string | null {
  const enrichment = names[membership.corporation.did]
  return enrichment?.organizationName ?? enrichment?.serviceName ?? null
}

export function KindBadges({
  operator,
  member,
  weight,
}: {
  operator: boolean
  member: boolean
  weight: string | null
}) {
  return (
    <span className="flex items-center gap-1">
      {operator ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {t('corporation.selector.operator')}
        </span>
      ) : null}
      {member ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-20 text-gray-700 dark:bg-neutral-70 dark:text-gray-200">
          {t('corporation.selector.member')}
          {weight ? ` ×${weight}` : ''}
        </span>
      ) : null}
    </span>
  )
}

function AttentionBadges({ counts }: { counts: CorporationAttention | undefined }) {
  if (!counts) return null
  return (
    <span className="flex items-center gap-1">
      {counts.pendingTasks > 0 ? (
        <span
          title={t('corporation.selector.pendingtasks')}
          className="min-w-5 h-5 px-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none"
        >
          {counts.pendingTasks}
        </span>
      ) : null}
      {counts.pendingVotes > 0 ? (
        <span
          title={t('corporation.selector.pendingvotes')}
          className="min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none"
        >
          {counts.pendingVotes}
        </span>
      ) : null}
    </span>
  )
}

function MembershipRow({
  membership,
  names,
  isActing,
  counts,
}: {
  membership: CorporationMembership
  names: Record<string, DidEnrichment>
  isActing: boolean
  counts: CorporationAttention | undefined
}) {
  const name = membershipDisplayName(membership, names)
  const countryCode = names[membership.corporation.did]?.countryCode
  const flag = countryCode ? countryCodeToFlag(countryCode) : null
  return (
    <>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          {flag ? <span aria-hidden="true">{flag}</span> : null}
          <span className="truncate font-medium text-gray-900 dark:text-white">
            {name ?? shortenMiddle(membership.corporation.did, 28)}
          </span>
          {isActing ? <FontAwesomeIcon icon={faCheck} className="text-primary-600 shrink-0" /> : null}
        </span>
        {name ? (
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {shortenMiddle(membership.corporation.did, 34)}
          </span>
        ) : null}
        <KindBadges operator={membership.operator} member={membership.member} weight={membership.weight} />
      </span>
      {!isActing ? <AttentionBadges counts={counts} /> : null}
    </>
  )
}

function ChooserModal({
  memberships,
  names,
  attention,
  onPick,
}: {
  memberships: CorporationMembership[]
  names: Record<string, DidEnrichment>
  attention: Record<number, CorporationAttention>
  onPick: (corporationId: number) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('corporation.chooser.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('corporation.chooser.desc')}</p>
        <div className="space-y-2">
          {memberships.map((membership) => (
            <button
              key={membership.corporation.id}
              type="button"
              onClick={() => onPick(membership.corporation.id)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm border border-neutral-20 dark:border-neutral-70 hover:bg-surface-muted dark:hover:bg-neutral-70/30"
            >
              <MembershipRow
                membership={membership}
                names={names}
                isActing={false}
                counts={attention[membership.corporation.id]}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CorporationChooserGate() {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const { memberships, needsSelection, selectionRequested, setActing } = useCorporationContext()
  const attention = useCorporationAttention(memberships)
  const names = useMembershipNames(memberships)

  if (!isWalletConnected || !(needsSelection || selectionRequested)) return null
  return <ChooserModal memberships={memberships} names={names} attention={attention} onPick={setActing} />
}

export default function CorporationSelector() {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const { memberships, acting, needsSelection, loading, setActing } = useCorporationContext()
  const attention = useCorporationAttention(memberships)
  const names = useMembershipNames(memberships)

  if (!isWalletConnected || loading) return null

  const actingName = acting ? membershipDisplayName(acting, names) : null
  const label = acting
    ? (actingName ?? shortenMiddle(acting.corporation.did, 24))
    : needsSelection
      ? t('corporation.selector.choose')
      : t('corporation.selector.none')

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
        <span className="truncate">{label}</span>
        <FontAwesomeIcon icon={faChevronDown} className="text-xs opacity-60" />
      </MenuButton>
      <MenuItems className="absolute right-0 z-30 mt-2 w-80 origin-top-right rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface shadow-lg focus:outline-none p-1">
        <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('corporation.selector.title')}
        </p>
        {memberships.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{t('corporation.selector.empty')}</p>
        ) : null}
        {memberships.map((membership) => (
          <MenuItem key={membership.corporation.id}>
            <button
              type="button"
              onClick={() => setActing(membership.corporation.id)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm data-[focus]:bg-surface-muted dark:data-[focus]:bg-neutral-70/30"
            >
              <MembershipRow
                membership={membership}
                names={names}
                isActing={acting?.corporation.id === membership.corporation.id}
                counts={attention[membership.corporation.id]}
              />
            </button>
          </MenuItem>
        ))}
        {operatorOnlyMode() ? null : (
          <MenuItem>
            <Link
              href="/corporation?create=1"
              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm font-medium text-primary-700 dark:text-primary-300 border-t border-neutral-20 dark:border-neutral-70 data-[focus]:bg-surface-muted dark:data-[focus]:bg-neutral-70/30"
            >
              <FontAwesomeIcon icon={faPlus} />
              {t('corporation.selector.create')}
            </Link>
          </MenuItem>
        )}
      </MenuItems>
    </Menu>
  )
}
