'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as React from 'react'
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/ui/shadcn/sidebar'

export function NavMain({ items }: { items: { title: string; url: string; icon?: React.ReactNode }[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.url === '/dashboard' ? pathname?.startsWith('/lab/dashboard') : pathname === item.url}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
