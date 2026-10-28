'use client'

import * as React from 'react'
import { SidebarInset, SidebarProvider } from '@/ui/shadcn/sidebar'
import { TooltipProvider } from '@/ui/shadcn/tooltip'
import { AppSidebar } from '@/ui/shell/app-sidebar'
import { CommandMenu, CommandMenuProvider } from '@/ui/shell/command-menu'
import { MobileTabBar } from '@/ui/shell/mobile-tab-bar'

const EXPANDED_QUERY = '(min-width: 1280px)'

function useSidebarOpenByWidth() {
  const [open, setOpen] = React.useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(EXPANDED_QUERY).matches
  )

  React.useEffect(() => {
    const mql = window.matchMedia(EXPANDED_QUERY)
    const onChange = () => setOpen(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return [open, setOpen] as const
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useSidebarOpenByWidth()

  return (
    <TooltipProvider>
      <CommandMenuProvider>
        <SidebarProvider
          open={open}
          onOpenChange={setOpen}
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 72)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset className="min-w-0 bg-page pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </SidebarInset>
          <MobileTabBar />
          <CommandMenu />
        </SidebarProvider>
      </CommandMenuProvider>
    </TooltipProvider>
  )
}
