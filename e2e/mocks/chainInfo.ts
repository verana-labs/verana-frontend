export const VERANA_TESTNET_CHAIN_INFO = {
  chainId: 'vna-testnet-1',
  chainName: 'VeranaTestnet1',
  rpc: 'https://rpc.testnet.verana.network',
  rest: 'https://api.testnet.verana.network',
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

export type VeranaChainInfo = typeof VERANA_TESTNET_CHAIN_INFO
