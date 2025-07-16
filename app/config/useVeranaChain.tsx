'use client';

import { Chain } from '@chain-registry/types';
import { env } from 'next-runtime-env';

export function useVeranaChain() {

  return {
    chain_type: 'cosmos',
    chain_name: env('NEXT_PUBLIC_VERANA_CHAIN_NAME'),
    pretty_name: env('NEXT_PUBLIC_VERANA_CHAIN_NAME'),
    chain_id:  env('NEXT_PUBLIC_VERANA_CHAIN_ID'),
    apis: {
      rpc: [{ address:  env('NEXT_PUBLIC_VERANA_RPC_ENDPOINT'), provider: 'verana' }],
      rest: [{ address:  env('NEXT_PUBLIC_VERANA_REST_ENDPOINT'), provider: 'verana' }],
    },
    status: 'live',
    network_type: 'testnet',
    bech32_prefix: "verana",
    slip44: 118,
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
  } as Chain;
}