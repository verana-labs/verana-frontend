// 'use client'

import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'
import { RestQueryProvider } from '@/providers/api-rest-query-provider-context'
import { ComponentsVersionProvider } from '@/providers/components-version-provider'
import { IndexerEventsProvider } from '@/providers/indexer-events-provider'
import { NotificationProvider } from '@/providers/notification-provider'
import RequireConnectedWallet from '@/providers/require-connected-wallet'

const VeranaChainProvider = dynamic(() => import('@/providers/verana-chain-provider'), { ssr: false })

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} defaultTheme="light">
      <VeranaChainProvider>
        <ComponentsVersionProvider>
          <IndexerEventsProvider>
            <RequireConnectedWallet>
              <NotificationProvider>
                <RestQueryProvider>{children}</RestQueryProvider>
              </NotificationProvider>
            </RequireConnectedWallet>
          </IndexerEventsProvider>
        </ComponentsVersionProvider>
      </VeranaChainProvider>
    </ThemeProvider>
  )
}
