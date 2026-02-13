'use client'

import '@/styles/global.css';
import { ChainProvider } from '@cosmos-kit/react';
import "@interchain-ui/react/styles";
import { veranaAssets } from '@/config/veranaChain.client';
import { wallets } from "cosmos-kit"
import { useVeranaChain } from "@/hooks/useVeranaChain";
import { env } from 'next-runtime-env';

export default function RootLayout({ children }: { children: React.ReactNode; }) {

  const veranaChain = useVeranaChain();
  const customChains = [veranaChain];
  const assetLists = [{ chain_name: veranaChain.chain_name, assets: [veranaAssets] }];
  const duration = Number(env('NEXT_PUBLIC_SESSION_LIFETIME_SECONDS') || process.env.NEXT_PUBLIC_SESSION_LIFETIME_SECONDS) * 1000;

  return (
      <ChainProvider
          sessionOptions={{ duration }}
          throwErrors= {true}
          chains={customChains}
          assetLists={assetLists}
          wallets={wallets}
          walletConnectOptions={{
            signClient: {
              projectId: 'e09f8de2a0b30d2e2ee9d061afb2667b',
              relayUrl: "wss://relay.walletconnect.org",
              metadata: {
                name: 'Verana',
                description: 'Verana dashboard for managing and joining digital trust Ecosystems.',
                url: 'https://verana.io',
                icons: ['https://verana.io/logo.svg'],
              },
            },
          }}
        >
        {children}
      </ChainProvider>
  );
}
