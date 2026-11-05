'use client'

import Link from 'next/link'
import type * as React from 'react'
import { configFooter } from '@/lib/dashlinks'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/ui/shadcn/sidebar'
import { useNavItems } from '@/ui/shell/nav-items'
import { NavMain } from '@/ui/shell/nav-main'
import { NavStatus } from '@/ui/shell/nav-status'
import { NavUser } from '@/ui/shell/nav-user'
import { TeamSwitcher } from '@/ui/shell/team-switcher'

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const items = useNavItems()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      data-shell="sidebar"
      className={cn('rtl:right-0! rtl:left-auto!', className)}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={configFooter.title}
              className="data-[slot=sidebar-menu-button]:p-1.5! group-data-[collapsible=icon]:p-1.5!"
            >
              <Link href={configFooter.href} onClick={() => setOpenMobile(false)}>
                <img src={configFooter.img} alt="" className="size-5" />
                <span className="text-base font-semibold">{configFooter.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <NavStatus className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
