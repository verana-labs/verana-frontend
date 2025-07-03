'use client'

import '@/app/ui/global.css';
import { inter } from '@/app/ui/common/fonts';
import { ChainProvider } from '@cosmos-kit/react';
// import { wallets as keplrWallets } from "@cosmos-kit/keplr-extension";
// import { wallets as leapWallets }  from "@cosmos-kit/leap-extension";
import "@interchain-ui/react/styles";
import type { SigningStargateClientOptions } from '@cosmjs/stargate';
import { veranaChain, veranaAssets, veranaRegistry, veranaAmino, veranaGasPrice, veranaAssetsListJson } from '@/app/config/veranachain';
import NavBar from '@/app/ui/common/nav-bar';
import SideNav from '@/app/ui/common/sidenav';
import {wallets} from "cosmos-kit"

// const walletAdapters = [
//   ...keplrWallets,
  // ...leapWallets,
// ];

export default function RootLayout({ children }: { children: React.ReactNode; }) {

  const customChains = [veranaChain];
  const assetLists = [{
                        chain_name: veranaChain.chain_name,
                        assets: [veranaAssets]
                      }];
                      
                      
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
      <main>
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
        <div className="w-full" >
          <NavBar />
          <div className="relative flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
              <SideNav />
            </div>
            <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
                  {children}
            </div>
          </div>
        </div>
      </ChainProvider>
      </main>
      </body>
    </html>

    
  );
}
