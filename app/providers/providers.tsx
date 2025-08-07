'use client'

import VeranaChainProvider from '@/app/providers/verana-chain-provider';
import RequireConnectedWallet from '@/app/providers/require-connected-wallet';
import { NotificationProvider } from '@/app/ui/common/notification-provider';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
        <VeranaChainProvider>
            <RequireConnectedWallet>
                <NotificationProvider>
                    {children}   
                </NotificationProvider>
            </RequireConnectedWallet>
        </VeranaChainProvider>  
    </ThemeProvider>
    );         
}