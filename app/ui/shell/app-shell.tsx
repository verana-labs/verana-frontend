'use client'

import type * as React from 'react'
import { SidebarInset, SidebarProvider } from '@/ui/shadcn/sidebar'
import { TooltipProvider } from '@/ui/shadcn/tooltip'
import { AppSidebar } from '@/ui/shell/app-sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-page">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
