// 'use client'

import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'
import { RestQueryProvider } from '@/providers/api-rest-query-provider-context'
import { ComponentsVersionProvider } from '@/providers/components-version-provider'
import { CorporationProvider } from '@/providers/corporation-provider'
import { IndexerEventsProvider } from '@/providers/indexer-events-provider'
import { NotificationProvider } from '@/providers/notification-provider'
import { LocaleBoundary, PreferencesProvider } from '@/providers/preferences-provider'
import RequireConnectedWallet from '@/providers/require-connected-wallet'
import { TxConfirmProvider } from '@/providers/tx-confirm-provider'
import { CorporationChooser } from '@/ui/common/corporation-chooser'
import { CorporationLostModal } from '@/ui/common/corporation-lost-modal'

const VeranaChainProvider = dynamic(() => import('@/providers/verana-chain-provider'), { ssr: false })

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem defaultTheme="system">
      <PreferencesProvider>
        <VeranaChainProvider>
          <ComponentsVersionProvider>
            <IndexerEventsProvider>
              <CorporationProvider>
                <CorporationChooser />
                <CorporationLostModal />
                <RequireConnectedWallet>
                  <NotificationProvider>
                    <TxConfirmProvider>
                      <RestQueryProvider>
                        <LocaleBoundary>{children}</LocaleBoundary>
                      </RestQueryProvider>
                    </TxConfirmProvider>
                  </NotificationProvider>
                </RequireConnectedWallet>
              </CorporationProvider>
            </IndexerEventsProvider>
          </ComponentsVersionProvider>
        </VeranaChainProvider>
      </PreferencesProvider>
    </ThemeProvider>
  )
}
