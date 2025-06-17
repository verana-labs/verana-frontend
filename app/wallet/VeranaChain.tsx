'use client';

import "@interchain-ui/react/styles";

import { SignerOptions, wallets } from "cosmos-kit";
import { ChainProvider, useChain } from "@cosmos-kit/react";

import Wallet from "./Wallet";
import { veranaChain, veranaAssets } from '../config/veranachain';

export default function VeranaChain() {

  const customChains = [veranaChain];
  const assetLists = [
                      {
                        chain_name: veranaChain.chain_name,
                        assets: [veranaAssets]
                      }];
                      
  const signerOptions: SignerOptions = {
    // signingStargate: () => {
    //   return getSigningStargateClient();
    // }
  };

  return (
      <ChainProvider
        chains={customChains}
        assetLists={assetLists}
        wallets={wallets}
        signerOptions={signerOptions}
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
          <Wallet/>
      </ChainProvider>
  );
}
