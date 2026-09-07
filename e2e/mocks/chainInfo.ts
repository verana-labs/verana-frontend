export const VERANA_DEVNET_CHAIN_INFO = {
  chainId: 'vna-devnet-1',
  chainName: 'VeranaDevnet1',
  rpc: 'https://rpc.devnet.verana.network',
  rest: 'https://api.devnet.verana.network',
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'verana',
    bech32PrefixAccPub: 'veranapub',
    bech32PrefixValAddr: 'veranavaloper',
    bech32PrefixValPub: 'veranavaloperpub',
    bech32PrefixConsAddr: 'veranavalcons',
    bech32PrefixConsPub: 'veranavalconspub',
  },
  currencies: [{ coinDenom: 'VNA', coinMinimalDenom: 'uvna', coinDecimals: 6 }],
  feeCurrencies: [
    {
      coinDenom: 'VNA',
      coinMinimalDenom: 'uvna',
      coinDecimals: 6,
      gasPriceStep: { low: 1, average: 3, high: 4 },
    },
  ],
  stakeCurrency: { coinDenom: 'VNA', coinMinimalDenom: 'uvna', coinDecimals: 6 },
  features: [],
} as const

export type VeranaChainInfo = typeof VERANA_DEVNET_CHAIN_INFO
