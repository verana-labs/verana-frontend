// 'use client'
import dynamic from "next/dynamic";

// import VeranaChainProvider from '@/providers/verana-chain-provider';
import RequireConnectedWallet from '@/providers/require-connected-wallet';
import { NotificationProvider } from '@/ui/common/notification-provider';
import { ThemeProvider } from 'next-themes';

const VeranaChainProvider = dynamic(
  () => import("@/providers/verana-chain-provider"),
  { ssr: false }
);

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