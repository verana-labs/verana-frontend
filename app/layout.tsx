'use client'

import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { ChainProvider } from '@cosmos-kit/react';
import { wallets } from "cosmos-kit";
import { veranaChain, veranaAssets } from '@/app/config/veranachain';
import NavBar from '@/app/ui/dashboard/nav-bar';
import SideNav from '@/app/ui/dashboard/sidenav';
import "@interchain-ui/react/styles";
import { MsgAddDID, MsgRemoveDID, MsgRenewDID, MsgTouchDID } from './proto-codecs/codec/veranablockchain/diddirectory/tx';
import { Registry } from '@cosmjs/proto-signing'
import { defaultRegistryTypes, AminoTypes } from "@cosmjs/stargate";
import { MsgAddDIDAminoConverter } from './proto-codecs/codec/veranablockchain/diddirectory/aminoConverters';
import type { SigningStargateClientOptions } from '@cosmjs/stargate'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const customChains = [veranaChain];
  const assetLists = [{
                        chain_name: veranaChain.chain_name,
                        assets: [veranaAssets]
                      }];
                      

  const customRegistry = new Registry([...defaultRegistryTypes]);
  customRegistry.register("/veranablockchain.diddirectory.MsgAddDID", MsgAddDID);
  customRegistry.register("/veranablockchain.diddirectory.MsgRemoveDID", MsgRemoveDID);
  customRegistry.register("/veranablockchain.diddirectory.MsgTouchDID", MsgTouchDID);
  customRegistry.register("/veranablockchain.diddirectory.MsgRenewDID", MsgRenewDID);
  
  const customAmino = new AminoTypes({
    '/veranablockchain.diddirectory.MsgAddDID': MsgAddDIDAminoConverter,
  });
                      
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
      <main>
      <ChainProvider
          chains={customChains}
          assetLists={assetLists}
          wallets={wallets}
          signerOptions={{
            // For the Stargate client, return these options:
            stargate: (): SigningStargateClientOptions => ({
              registry: customRegistry,
              aminoTypes: customAmino,
              // you can also set gasPrice here if you want:
              // gasPrice: GasPrice.fromString('0.025uvna'),
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
