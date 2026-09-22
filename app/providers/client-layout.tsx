'use client'

import { useEffect, useState } from 'react'
import { applyLocale, loadStoredLocale, resolveLocale } from '@/i18n/dataview'
import type { ProtocolParams } from '@/lib/protocolParams'
import { ProtocolParamsProvider } from '@/providers/protocol-params-context'
import Providers from '@/providers/providers'
import NavBar from '@/ui/common/nav-bar'
import SideNav from '@/ui/common/sidenav'

export default function ClientLayout({
  protocolParams,
  children,
}: {
  protocolParams: ProtocolParams
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    applyLocale(resolveLocale(loadStoredLocale(), navigator.languages))
    setMounted(true)
  }, [])
  if (!mounted) return null

  return (
    <Providers>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="app-header">
          <NavBar />
        </header>

        {/* Main Container */}
        <div className="app-container flex-1 flex">
          {/* Side Navigation */}
          <aside className="hidden lg:flex">
            <SideNav />
          </aside>

          {/* Content */}
          <ProtocolParamsProvider value={protocolParams}>
            <div className="app-content">
              <main id="app-scroll" className="app-content-inner h-full overflow-y-auto">
                {children}
              </main>
            </div>
          </ProtocolParamsProvider>
        </div>
      </div>
    </Providers>
  )
}
