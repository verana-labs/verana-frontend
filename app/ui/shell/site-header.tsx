'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { getNavLinks } from '@/lib/navlinks'
import { CorporationSelector } from '@/ui/common/corporation-selector'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Separator } from '@/ui/shadcn/separator'
import { SidebarTrigger } from '@/ui/shadcn/sidebar'

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = translate(isDark ? 'navbar.theme.toLight' : 'navbar.theme.toDark')

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export function SiteHeader({ title }: { title?: string }) {
  const veranaChain = useVeranaChain()
  const pathname = usePathname()
  const heading = title ?? getNavLinks().find((link) => link.href === pathname)?.name

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 rounded-t-[inherit] border-b bg-page/90 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        {heading ? (
          <>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <h1 className="truncate text-base font-medium">{heading}</h1>
          </>
        ) : null}
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <Badge variant="outline" className="hidden h-6 gap-1.5 px-2.5 font-mono sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {veranaChain.chain_id}
          </Badge>
          <CorporationSelector />
          <ThemeButton />
        </div>
      </div>
    </header>
  )
}
