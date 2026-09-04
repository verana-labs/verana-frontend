// 'use client'

import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'
import { RestQueryProvider } from '@/providers/api-rest-query-provider-context'
import { ComponentsVersionProvider } from '@/providers/components-version-provider'
import { CorporationProvider } from '@/providers/corporation-provider'
import { IndexerEventsProvider } from '@/providers/indexer-events-provider'
import { NotificationProvider } from '@/providers/notification-provider'
import RequireConnectedWallet from '@/providers/require-connected-wallet'
import { TxConfirmProvider } from '@/providers/tx-confirm-provider'

const VeranaChainProvider = dynamic(() => import('@/providers/verana-chain-provider'), { ssr: false })

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} defaultTheme="light">
      <VeranaChainProvider>
        <ComponentsVersionProvider>
          <IndexerEventsProvider>
            <RequireConnectedWallet>
              <CorporationProvider>
                <NotificationProvider>
                  <TxConfirmProvider>
                    <RestQueryProvider>{children}</RestQueryProvider>
                  </TxConfirmProvider>
                </NotificationProvider>
              </CorporationProvider>
            </RequireConnectedWallet>
          </IndexerEventsProvider>
        </ComponentsVersionProvider>
      </VeranaChainProvider>
    </ThemeProvider>
  )
}
