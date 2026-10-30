'use client'

import { useChain } from '@cosmos-kit/react'
import { Building2Icon, ChevronsUpDownIcon, PlusIcon, RotateCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/ui/shadcn/sidebar'
import { Skeleton } from '@/ui/shadcn/skeleton'

export const NEW_CORPORATION_HREF = '/corporation/new'

export function actingRoleLabel(membership: CorporationMembership | null): string {
  if (!membership) return translate('shell.switcher.personal')
  if (membership.operator && membership.member) return translate('shell.switcher.role.both')
  if (membership.operator) return translate('shell.switcher.role.operator')
  return translate('shell.switcher.role.member')
}

function CorporationMark({ name, warn }: { name: string | null; warn: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold',
        name
          ? 'bg-linear-to-br from-primary-400 to-primary-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]'
          : warn
            ? 'bg-warning/15 text-warning ring-1 ring-warning/30'
            : 'bg-primary/10 text-primary ring-1 ring-primary/15'
      )}
    >
      {name ? nameInitials(name) : <Building2Icon className="size-4" />}
    </span>
  )
}

const MENU_ICON = 'flex size-6 items-center justify-center rounded-md border border-border bg-background'

export function TeamSwitcher() {
  const { isMobile, state, setOpenMobile } = useSidebar()
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const { memberships, actingCorporation, needsSelection, loading, error, attention, setActingCorporation, refetch } =
    useUserCorporation()

  if (!isWalletConnected) return null

  if (loading && memberships.length === 0) {
    return (
      <SidebarMenu data-shell="team-switcher" aria-busy="true">
        <SidebarMenuItem className="flex h-12 items-center gap-2 px-2 group-data-[collapsible=icon]:px-0">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <span className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </span>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const corporationName = actingCorporation
    ? (corporationDisplayName(actingCorporation.corporation.trustData) ?? actingCorporation.corporation.did)
    : null
  const name =
    corporationName ?? translate(needsSelection ? 'corporation.selector.choose' : 'corporation.selector.none')
  const othersNeedAttention = memberships.some((membership) => {
    if (membership.corporation.id === actingCorporation?.corporation.id) return false
    const counts = attention[membership.corporation.id]
    return Boolean(counts && (counts.pendingTasks > 0 || counts.pendingVotes > 0))
  })

  return (
    <SidebarMenu data-shell="team-switcher">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={name}
              title={actingCorporation?.corporation.did}
              className={cn(
                'h-12 rounded-xl bg-sidebar-accent/50 ring-1 ring-sidebar-border transition-colors duration-(--duration-fast) hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:ring-0',
                needsSelection && 'ring-warning/40'
              )}
            >
              <span className="relative">
                <CorporationMark name={corporationName} warn={needsSelection} />
                {othersNeedAttention ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-sidebar"
                  />
                ) : null}
              </span>
              <span className="grid min-w-0 flex-1 text-start leading-tight">
                <span className={cn('truncate text-sm font-semibold tracking-tight', needsSelection && 'text-warning')}>
                  {name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {error ? (
                    <span title={error} className="text-destructive">
                      {translate('corporation.selector.error')}
                    </span>
                  ) : (
                    actingRoleLabel(actingCorporation)
                  )}
                </span>
              </span>
              <ChevronsUpDownIcon aria-hidden="true" className="ms-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side={isMobile ? 'bottom' : state === 'collapsed' ? 'right' : 'bottom'}
            sideOffset={6}
            className="w-80 max-w-[calc(100vw-2rem)] rounded-xl p-1.5"
          >
            <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              {translate('corporation.selector.title')}
            </DropdownMenuLabel>
            {error ? (
              <div
                role="alert"
                className="mx-1 mb-1 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2"
              >
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
              <span className={MENU_ICON}>
                <RotateCwIcon
                  aria-hidden="true"
                  className={cn('size-3.5', loading && 'animate-spin motion-reduce:animate-none')}
                />
              </span>
              {translate('corporation.selector.refresh')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 rounded-lg p-2 font-medium">
              <Link href={NEW_CORPORATION_HREF} onClick={() => setOpenMobile(false)}>
                <span className={cn(MENU_ICON, 'border-primary/25 bg-primary/10 text-primary')}>
                  <PlusIcon aria-hidden="true" className="size-3.5" />
                </span>
                {translate('corporation.selector.create')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
