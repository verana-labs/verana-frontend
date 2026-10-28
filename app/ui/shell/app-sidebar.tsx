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
import Link from 'next/link'
import type * as React from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { configFooter } from '@/lib/dashlinks'
import { getNavLinks } from '@/lib/navlinks'
import { usePendingTasksCtx } from '@/providers/api-rest-query-provider-context'
import { atLeast } from '@/ui/corporation/shared'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/ui/shadcn/sidebar'
import { NavMain } from '@/ui/shell/nav-main'
import { NavStatus } from '@/ui/shell/nav-status'
import { NavUser } from '@/ui/shell/nav-user'

const NAV_ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <GaugeIcon />,
  '/account': <CircleUserRoundIcon />,
  '/corporation': <Building2Icon />,
  '/ecosystems': <ShieldIcon />,
  '/agents': <BotIcon />,
  '/discover': <CompassIcon />,
  '/pendingtasks': <ListTodoIcon />,
  '/settings': <SettingsIcon />,
}

function useNavItems() {
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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const items = useNavItems()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href={configFooter.href}>
                <img src={configFooter.img} alt="" className="size-5" />
                <span className="text-base font-semibold">{configFooter.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <NavStatus className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
