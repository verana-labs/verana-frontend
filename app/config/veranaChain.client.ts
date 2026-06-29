/** biome-ignore-all lint/style/noNonNullAssertion: NEXT_PUBLIC_* vars are inlined by Next at build time and validated by entrypoint.sh at container start */
'use client'

import { Asset } from '@chain-registry/types'
import {
  VERANA_CHAIN_ID,
  VERANA_CHAIN_NAME,
  VERANA_EXPLORER_URL,
  VERANA_REST_ENDPOINT,
  VERANA_RPC_ENDPOINT,
} from '@/config/env'

export const veranaChainEnv = {
  chain_type: 'cosmos',
  chain_name: VERANA_CHAIN_NAME!,
  pretty_name: VERANA_CHAIN_NAME!,
  chain_id: VERANA_CHAIN_ID!,
  apis: {
    rpc: [{ address: VERANA_RPC_ENDPOINT!, provider: 'verana' }],
    rest: [{ address: VERANA_REST_ENDPOINT!, provider: 'verana' }],
  },
  status: 'live',
  network_type: VERANA_CHAIN_ID?.includes('devnet') ? 'devnet' : 'testnet',
  bech32_prefix: 'verana',
  slip44: 118,
  key_algos: ['secp256k1'],
  staking: {
    staking_tokens: [{ denom: 'uvna' }],
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
      kind: 'Verana Explorer',
      url: VERANA_EXPLORER_URL || '',
      tx_page: `${VERANA_EXPLORER_URL || ''}/tx/\${txHash}`,
    },
  ],
}

export const veranaAssets: Asset = {
  description: 'The native staking and governance token of the Verana network.',
  type_asset: 'sdk.coin',
  base: 'uvna',
  name: 'Verana Token',
  display: 'VNA',
  symbol: 'VNA',
  denom_units: [
    { denom: 'uvna', exponent: 0 },
    { denom: 'VNA', exponent: 6 },
  ],
}
