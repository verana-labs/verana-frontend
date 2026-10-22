'use client'

import { useChain } from '@cosmos-kit/react'
import { CopyIcon, EllipsisVerticalIcon, ExternalLinkIcon, LogOutIcon, WalletIcon } from 'lucide-react'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/ui/shadcn/sidebar'
import { shortenMiddle } from '@/util/util'

export function NavUser() {
  const { isMobile } = useSidebar()
  const veranaChain = useVeranaChain()
  const explorerUrl = veranaChain.explorers?.[0]?.url
  const { status, address, connect, openView } = useChain(veranaChain.chain_name)
  const { copied, copy } = useCopyFeedback(address)

  if (!address) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => void connect()}
            disabled={status === 'Connecting'}
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
          >
            <WalletIcon />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{translate('notconnected.nav.title')}</span>
              <span className="truncate text-xs opacity-80">{translate('notconnected.nav.click')}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const short = shortenMiddle(address, 13)
  const identity = (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
          <WalletIcon className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-mono font-medium">{short}</span>
        <span className="truncate text-xs text-muted-foreground">
          {translate(copied ? 'copied.label' : 'connected.title')}
        </span>
      </div>
    </>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {identity}
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">{identity}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => void copy()}>
                <CopyIcon />
                {translate('navbar.addresscopy.title')}
              </DropdownMenuItem>
              {explorerUrl ? (
                <DropdownMenuItem onSelect={() => window.open(`${explorerUrl}/account/${address}`, '_blank')}>
                  <ExternalLinkIcon />
                  {translate('navbar.mintscan.title')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openView()}>
              <LogOutIcon />
              {translate('navbar.disconnect.title')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
