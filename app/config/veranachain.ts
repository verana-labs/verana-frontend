import { Chain, Asset } from '@chain-registry/types';

export const veranaChain: Chain = {
  chain_type: 'bip122',
  chain_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,// ? process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME : 'VeranaTestnet',
  pretty_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,// ? process.env.NEXT_PUBLIC_CHAIN_NAME : 'VeranaTestnet',
  chain_id: process.env.NEXT_PUBLIC_VERANA_CHAIN_ID!,//
  //  ? process.env.NEXT_PUBLIC_VERANA_CHAIN_ID : "vna-testnet-1",
//   chain_id: "vna-testnet-1",
//   chain_name: 'VeranaTestnet',
//   pretty_name: 'VeranaTestnet',
  apis: {
    rpc: [{ address: process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT!,// ? process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT : 'https://rpc.testnet.verana.network',
        provider: 'verana' }],
    rest: [{ address: process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT!,// ? process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT : 'https://api.testnet.verana.network',
        provider: 'verana' }],
    // rpc: [{ address: 'https://rpc.testnet.verana.network', provider: 'verana' }],
    // rest: [{ address: 'https://api.testnet.verana.network', provider: 'verana' }],
  },
  status: 'live',
  network_type: 'testnet',
  bech32_prefix: "verana",
  slip44:  118,
  fees: {
    fee_tokens: [
      {
        denom: 'VNA',
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
    type_asset: 'unknown',
    base: 'uvna',
    name: 'VeranaToken',
    display: 'VNA',
    symbol: 'VNA',
    denom_units: []
};
