// 'use client'

import dynamic from "next/dynamic";
import RequireConnectedWallet from '@/providers/require-connected-wallet';
import { NotificationProvider } from '@/ui/common/notification-provider';
import { ThemeProvider } from 'next-themes';
import { PendingTasksProvider } from "./pending-tasks-provider-context";

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
            <RequireConnectedWallet>
                <NotificationProvider>
                  <PendingTasksProvider>
                    {children}   
                  </PendingTasksProvider>
                </NotificationProvider>
            </RequireConnectedWallet>
        </VeranaChainProvider>  
    </ThemeProvider>
    );         
}
