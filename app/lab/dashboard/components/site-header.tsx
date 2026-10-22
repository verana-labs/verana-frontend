'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
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

export function SiteHeader({ title }: { title: string }) {
  const veranaChain = useVeranaChain()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden h-6 gap-1.5 px-2.5 font-mono sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {veranaChain.chain_id}
          </Badge>
          <div className="hidden md:block">
            <CorporationSelector />
          </div>
          <ThemeButton />
        </div>
      </div>
    </header>
  )
}
