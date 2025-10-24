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
              projectId: "a8510432ebb71e6948cfd6cde54b70f7",
              relayUrl: "wss://relay.walletconnect.org",
              metadata: {
                name: 'Cosmos Kit dApp',
                description: 'Cosmos Kit dApp built by Create Cosmos App',
                url: "https://docs.hyperweb.io/cosmos-kit/",
                icons: [],
              },
            },
          }}
        >
        {children}
      </ChainProvider>
  );
}
