'use client'

import { useChain } from '@cosmos-kit/react'
import {
  BotIcon,
  Building2Icon,
  CircleUserRoundIcon,
  CompassIcon,
  GaugeIcon,
  ListTodoIcon,
  SettingsIcon,
  ShieldIcon,
} from 'lucide-react'
import type * as React from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { getNavLinks } from '@/lib/navlinks'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import { atLeast } from '@/ui/corporation/shared'

export type NavItem = { title: string; url: string; icon: React.ReactNode; badge?: string }

export const NAV_ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <GaugeIcon />,
  '/account': <CircleUserRoundIcon />,
  '/corporation': <Building2Icon />,
  '/ecosystems': <ShieldIcon />,
  '/agents': <BotIcon />,
  '/discover': <CompassIcon />,
  '/pendingtasks': <ListTodoIcon />,
  '/settings': <SettingsIcon />,
}

export function useNavItems(): NavItem[] {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const pendingTasksCtx = usePendingTasksCtx()
  const { actingCorporation, attention } = useUserCorporation()

  const totalPendingTasks = pendingTasksCtx.pendingParticipants.reduce((total, item) => total + item.pending_tasks, 0)
  const actingAttention = actingCorporation ? attention[actingCorporation.corporation.id] : undefined
  const votesPartial = actingAttention?.pendingVotesPartial ?? false
  const partialCounts: Record<string, boolean> = {
    '/pendingtasks': pendingTasksCtx.partial || votesPartial,
    '/corporation': votesPartial,
  }

  return getNavLinks(totalPendingTasks, actingAttention?.pendingVotes ?? 0)
    .filter((link) => (isWalletConnected || link.availableOffline) && (!link.requiresCorporation || actingCorporation))
    .map((link) => ({
      title: link.name,
      url: link.href,
      icon: NAV_ICONS[link.href],
      badge: link.count ? atLeast(link.count, partialCounts[link.href] ?? false) : undefined,
    }))
}
