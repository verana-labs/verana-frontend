'use client'

import { usePathname } from 'next/navigation'
import { Fragment, type ReactNode, useEffect, useState } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { applyLocale, loadStoredLocale, resolveLocale } from '@/i18n/dataview'
import type { ProtocolParams } from '@/lib/protocolParams'
import { ProtocolParamsProvider } from '@/providers/protocol-params-context'
import Providers from '@/providers/providers'
import { AppShell } from '@/ui/shell/app-shell'
import { SiteHeader } from '@/ui/shell/site-header'

function CorporationScopedContent({ children }: { children: ReactNode }) {
  const { switchCount } = useUserCorporation()
  return <Fragment key={switchCount}>{children}</Fragment>
}

export default function ClientLayout({
  protocolParams,
  children,
}: {
  protocolParams: ProtocolParams
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    applyLocale(resolveLocale(loadStoredLocale(), navigator.languages))
    setMounted(true)
  }, [])
  if (!mounted) return null

  if (pathname?.startsWith('/lab/')) {
    return (
      <Providers>
        <ProtocolParamsProvider value={protocolParams}>{children}</ProtocolParamsProvider>
      </Providers>
    )
  }

  return (
    <Providers>
      <ProtocolParamsProvider value={protocolParams}>
        <AppShell>
          <SiteHeader />
          <main className="app-content-inner w-full">
            <CorporationScopedContent>{children}</CorporationScopedContent>
          </main>
        </AppShell>
      </ProtocolParamsProvider>
    </Providers>
  )
}
