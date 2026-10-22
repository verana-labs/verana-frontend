'use client'

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
import { NavMain } from '@/lab/dashboard/components/nav-main'
import { NavStatus } from '@/lab/dashboard/components/nav-status'
import { NavUser } from '@/lab/dashboard/components/nav-user'
import { configFooter } from '@/lib/dashlinks'
import { getNavLinks } from '@/lib/navlinks'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/ui/shadcn/sidebar'

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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const items = getNavLinks().map((link) => ({
    title: link.name,
    url: link.href,
    icon: NAV_ICONS[link.href],
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/dashboard">
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
