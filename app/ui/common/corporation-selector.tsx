'use client'

import { useChain } from '@cosmos-kit/react'
import { Building2Icon, ChevronsUpDownIcon, PlusIcon, RotateCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { CorporationMembershipRow, corporationDisplayName } from '@/ui/common/corporation-membership-row'
import { nameInitials } from '@/ui/corporation/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'

export function CorporationSelector() {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const { memberships, actingCorporation, needsSelection, loading, error, attention, setActingCorporation, refetch } =
    useUserCorporation()

  if (!isWalletConnected || (loading && memberships.length === 0)) return null

  const name = actingCorporation ? corporationDisplayName(actingCorporation.corporation.trustData) : null
  const label = actingCorporation
    ? (name ?? actingCorporation.corporation.did)
    : translate(needsSelection ? 'corporation.selector.choose' : 'corporation.selector.none')
  const role = actingCorporation
    ? [
        actingCorporation.operator ? translate('corporation.selector.operator') : null,
        actingCorporation.member ? translate('corporation.selector.member') : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group/corp flex h-9 max-w-36 min-w-0 items-center gap-2 rounded-lg border px-1.5 text-start text-sm font-medium outline-none transition-colors duration-(--duration-base) ease-standard focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted sm:max-w-56 sm:pe-2',
          needsSelection
            ? 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/15'
            : 'border-border bg-background text-foreground hover:bg-muted dark:bg-input/30'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold',
            actingCorporation ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {actingCorporation ? nameInitials(label) : <Building2Icon className="size-3.5" />}
        </span>
        <span className="grid min-w-0 flex-1 leading-tight" title={actingCorporation?.corporation.did}>
          <span className="truncate">{label}</span>
          {role ? (
            <span className="hidden truncate text-[10px] font-normal text-muted-foreground xl:block">{role}</span>
          ) : null}
        </span>
        {error ? (
          <span
            title={error}
            className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-destructive uppercase"
          >
            {translate('corporation.selector.error')}
          </span>
        ) : null}
        <ChevronsUpDownIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-80 max-w-[calc(100vw-2rem)] rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2 pt-1.5 pb-1">{translate('corporation.selector.title')}</DropdownMenuLabel>
        {error ? (
          <div className="mx-1 mb-1 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2">
            <p className="text-xs font-semibold text-destructive">{translate('corporation.selector.error')}</p>
            <p className="mt-0.5 text-xs break-all text-muted-foreground">{error}</p>
          </div>
        ) : null}
        {memberships.length === 0 && !error ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">{translate('corporation.selector.empty')}</p>
        ) : null}
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.corporation.id}
            onSelect={() => setActingCorporation(membership.corporation.id)}
            className="items-start justify-between gap-2 rounded-lg p-2"
          >
            <CorporationMembershipRow
              membership={membership}
              isActing={actingCorporation?.corporation.id === membership.corporation.id}
              attention={attention[membership.corporation.id]}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={loading}
          onSelect={(event) => {
            event.preventDefault()
            void refetch()
          }}
          className="gap-2 rounded-lg p-2"
        >
          <span className="flex size-6 items-center justify-center rounded-md border border-border">
            <RotateCwIcon aria-hidden="true" className={cn('size-3.5', loading && 'animate-spin')} />
          </span>
          {translate('corporation.selector.refresh')}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2 rounded-lg p-2 font-medium">
          <Link href="/corporation/new">
            <span className="flex size-6 items-center justify-center rounded-md border border-border">
              <PlusIcon aria-hidden="true" className="size-3.5" />
            </span>
            {translate('corporation.selector.create')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
