'use client'

import { SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { configFooter } from '@/lib/dashlinks'
import { cn } from '@/lib/utils'
import { CorporationSelector } from '@/ui/common/corporation-selector'
import { Button } from '@/ui/shadcn/button'
import { Separator } from '@/ui/shadcn/separator'
import { SidebarTrigger, useSidebar } from '@/ui/shadcn/sidebar'
import { ThemeToggle } from '@/ui/shell/theme-toggle'

const NETWORK_TONE: Record<string, string> = {
  devnet: 'border-info/25 bg-info/10 text-info',
  testnet: 'border-warning/25 bg-warning/10 text-warning',
}

const NETWORK_DOT: Record<string, string> = {
  devnet: 'bg-info',
  testnet: 'bg-warning',
}

function NetworkChip() {
  const veranaChain = useVeranaChain()
  const networkType = String(veranaChain.network_type ?? '')
  return (
    <span
      data-shell="network-chip"
      title={veranaChain.chain_id}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 font-mono text-xs font-medium',
        NETWORK_TONE[networkType] ?? 'border-success/25 bg-success/10 text-success'
      )}
    >
      <span
        aria-hidden="true"
        className={cn('pulse-dot relative size-1.5 rounded-full', NETWORK_DOT[networkType] ?? 'bg-success')}
      />
      <span>{veranaChain.chain_id}</span>
    </span>
  )
}

export function SiteHeader({ title }: { title?: string }) {
  const settingsLabel = translate('navbar.settings.title')
  const { isMobile } = useSidebar()

  return (
    <header
      data-shell="header"
      className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 rounded-t-[inherit] border-b bg-page/90 backdrop-blur transition-[width,height] ease-linear"
    >
      <div className="flex w-full min-w-0 items-center gap-1.5 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hidden md:inline-flex" aria-label={translate('shell.sidebar.toggle')} />
        <Link
          href={configFooter.href}
          aria-label={configFooter.title}
          className="-ml-0.5 shrink-0 rounded-md md:hidden"
        >
          <img src={configFooter.img} alt="" className="size-6" />
        </Link>
        {title ? (
          <>
            <Separator orientation="vertical" className="mx-1 hidden data-[orientation=vertical]:h-4 md:block" />
            <span className="min-w-0 truncate text-sm font-medium md:text-base">{title}</span>
          </>
        ) : null}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <NetworkChip />
          {isMobile ? (
            <div className="contents max-sm:[&_[data-slot=dropdown-menu-trigger]>span:nth-of-type(2)]:sr-only max-sm:[&_[data-slot=dropdown-menu-trigger]>svg]:hidden">
              <CorporationSelector />
            </div>
          ) : null}
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
            <Link href="/settings" aria-label={settingsLabel} title={settingsLabel}>
              <SettingsIcon />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
