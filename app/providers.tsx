'use client'

import '@/app/ui/global.css';
import { ChainProvider } from '@cosmos-kit/react';
import "@interchain-ui/react/styles";
import type { SigningStargateClientOptions } from '@cosmjs/stargate';
import { veranaAssets, veranaRegistry, veranaAmino, veranaGasPrice } from '@/app/config/veranaChain';
import {wallets} from "cosmos-kit"
import { ThemeProvider } from 'next-themes';
import { useVeranaChain } from "@/app/config/useVeranaChain";

export default function RootLayout({ children }: { children: React.ReactNode; }) {

  const veranaChain = useVeranaChain();

  const customChains = [veranaChain];
  const assetLists = [{ chain_name: veranaChain.chain_name, assets: [veranaAssets] }];
  console.info(veranaRegistry);
  console.info(veranaAmino);
                      
  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      <ChainProvider
          throwErrors= {true}
          chains={customChains}
          assetLists={assetLists}
          wallets={wallets}
          signerOptions={{
            stargate: (): SigningStargateClientOptions => ({
              registry: veranaRegistry,
              aminoTypes: veranaAmino,
              gasPrice: veranaGasPrice,
            }),
          }}          
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
    </ThemeProvider>
  );
}
