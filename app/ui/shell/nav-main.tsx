'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { translate } from '@/i18n/dataview'
import { Badge } from '@/ui/shadcn/badge'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from '@/ui/shadcn/sidebar'
import type { NavItem } from '@/ui/shell/nav-items'

const SKELETON_ITEMS = ['a', 'b', 'c', 'd', 'e', 'f']

function isActiveRoute(pathname: string | null, url: string) {
  return pathname === url || (pathname?.startsWith(`${url}/`) ?? false)
}

export function NavMain({ items, settling = false }: { items: NavItem[]; settling?: boolean }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <nav aria-label={translate('shell.nav.label')}>
          <SidebarMenu aria-busy={settling || undefined}>
            {settling
              ? SKELETON_ITEMS.map((key) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))
              : null}
            {(settling ? [] : items).map((item) => {
              const active = isActiveRoute(pathname, item.url)
              return (
                <SidebarMenuItem key={item.url} data-nav-item={item.url}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.badge ? `${item.title} (${item.badge})` : item.title}
                    isActive={active}
                  >
                    <Link
                      href={item.url}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      <span className="relative flex">
                        {item.icon}
                        {item.badge ? (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1 -right-1 hidden size-2 rounded-full bg-destructive ring-2 ring-sidebar group-data-[collapsible=icon]:block"
                          />
                        ) : null}
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge>
                      <Badge variant="destructive" data-nav-badge="">
                        {item.badge}
                      </Badge>
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
