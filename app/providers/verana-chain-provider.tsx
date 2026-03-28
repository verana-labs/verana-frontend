'use client'

import '@/styles/global.css';
import { ChainProvider } from '@cosmos-kit/react';
import "@interchain-ui/react/styles";
import { veranaAssets } from '@/config/veranaChain.client';
import { getPublicEnv } from '@/lib/publicEnv';
import { wallets } from "cosmos-kit"
import { useVeranaChain } from "@/hooks/useVeranaChain";

export default function RootLayout({ children }: { children: React.ReactNode; }) {

  const veranaChain = useVeranaChain();
  const customChains = [veranaChain];
  const assetLists = [{ chain_name: veranaChain.chain_name, assets: [veranaAssets] }];
  const duration = Number(getPublicEnv('NEXT_PUBLIC_SESSION_LIFETIME_SECONDS') ?? '0') * 1000;
  const projectId = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_PROJECT_ID')!;
  const relayUrl = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_RELAY_URL')!;
  const name = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_NAME')!;
  const description = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_DESCRIPTION')!;
  const url = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_URL')!;
  const icons = [getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_ICONS')!];

  return (
      <ChainProvider
          sessionOptions={{ duration }}
          throwErrors= {true}
          chains={customChains}
          assetLists={assetLists}
          wallets={wallets}
          walletConnectOptions={{
            signClient: {
              projectId,
              relayUrl,
              metadata: {
                name,
                description,
                url,
                icons,
              },
            },
          }}
        >
        {children}
      </ChainProvider>
  );
}
