'use client'

import { Asset } from '@chain-registry/types';

export const veranaChainEnv = {
  chain_type: 'cosmos',
  chain_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,
  pretty_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,
  chain_id: process.env.NEXT_PUBLIC_VERANA_CHAIN_ID!,
  apis: {
    rpc: [{ address: process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT!, provider: 'verana' }],
    rest: [{ address: process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT!, provider: 'verana' }],

    },
  status: 'live',
  network_type: 'testnet',
  bech32_prefix: "verana",
  slip44:  118,
  staking: {
    staking_tokens: [
      { denom: "uvna" }
    ]
  },
  fees: {
    fee_tokens: [
      {
        denom: 'uvna',
        fixed_min_gas_price: 1,
        low_gas_price: 1,
        average_gas_price: 3,
        high_gas_price: 4,
      },
    ],
  },
  explorers: [
    {
      kind: 'veranaexplorer',
      url: 'https://explorer.testnet.verana.network',
      tx_page: 'https://explorer.mychain.org/tx/${txHash}',
    },  
 ],

};

export const veranaAssets: Asset = {
    description: "Verana Token",
    type_asset: 'unknown',
    base: 'uvna',
    name: 'VeranaToken',
    display: 'VNA',
    symbol: 'VNA',
    denom_units: [
      { denom: "uvna", exponent: 0 },
      { denom: "VNA",  exponent: 6 }
    ]
};
