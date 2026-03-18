// 'use client'

import dynamic from "next/dynamic";
import RequireConnectedWallet from '@/providers/require-connected-wallet';
import { NotificationProvider } from '@/providers/notification-provider';
import { ThemeProvider } from 'next-themes';
import { PendingTasksProvider } from "@/providers/pending-tasks-provider-context";
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
                  <PendingTasksProvider>
                    {children}   
                  </PendingTasksProvider>
                </NotificationProvider>
            </RequireConnectedWallet>
          </IndexerEventsProvider>
        </VeranaChainProvider>  
    </ThemeProvider>
    );         
}
