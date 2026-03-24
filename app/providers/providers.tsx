// 'use client'

import dynamic from "next/dynamic";
import RequireConnectedWallet from '@/providers/require-connected-wallet';
import { NotificationProvider } from '@/providers/notification-provider';
import { ThemeProvider } from 'next-themes';
import { RestQueryProvider } from "@/providers/api-rest-query-provider-context";
import { IndexerEventsProvider } from "@/providers/indexer-events-provider";

const VeranaChainProvider = dynamic(
  () => import("@/providers/verana-chain-provider"),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      defaultTheme="light"
    >
        <VeranaChainProvider>
          <IndexerEventsProvider>
            <RequireConnectedWallet>
                <NotificationProvider>
                  <RestQueryProvider>
                    {children}   
                  </RestQueryProvider>
                </NotificationProvider>
            </RequireConnectedWallet>
          </IndexerEventsProvider>
        </VeranaChainProvider>  
    </ThemeProvider>
    );         
}
