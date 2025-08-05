import { Asset } from '@chain-registry/types';
import { GasPrice, AminoTypes } from "@cosmjs/stargate";
import { Registry } from '@cosmjs/proto-signing'
import { MsgAddDIDAminoConverter, MsgRemoveDIDAminoConverter, MsgRenewDIDAminoConverter, MsgTouchDIDAminoConverter } 
        from '@/app/msg/amino-converter/aminoConvertersDID';
import { MsgReclaimTrustDepositAminoConverter, MsgReclaimTrustDepositYieldAminoConverter, MsgRepaySlashedTrustDepositAminoConverter } 
        from '@/app/msg/amino-converter/aminoConvertersTD';
import { MsgCreateTrustRegistryAminoConverter, MsgUpdateTrustRegistryAminoConverter, MsgArchiveTrustRegistryAminoConverter } 
        from '@/app/msg/amino-converter/aminoConvertersTR';
import { MsgAddDID, MsgRemoveDID, MsgRenewDID, MsgTouchDID } from '@/proto-codecs/codec/verana/dd/v1/tx';
import { MsgReclaimTrustDeposit, MsgReclaimTrustDepositYield, MsgRepaySlashedTrustDeposit } from '@/proto-codecs/codec/verana/td/v1/tx';
import { MsgArchiveTrustRegistry, MsgCreateTrustRegistry, MsgUpdateTrustRegistry } from '@/proto-codecs/codec/verana/tr/v1/tx';

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

export const veranaRegistry = new Registry([
    // ...defaultRegistryTypes,
    // verana.dd.v1
    ["/verana.dd.v1.MsgAddDID", MsgAddDID],
    ["/verana.dd.v1.MsgRenewDID", MsgRenewDID],
    ["/verana.dd.v1.MsgTouchDID", MsgTouchDID],
    ["/verana.dd.v1.MsgRemoveDID", MsgRemoveDID],
    // verana.td.v1
    ["/verana.td.v1.MsgReclaimTrustDepositYield", MsgReclaimTrustDepositYield],
    ["/verana.td.v1.MsgReclaimTrustDeposit", MsgReclaimTrustDeposit],
    ["/verana.td.v1.MsgRepaySlashedTrustDeposit", MsgRepaySlashedTrustDeposit],
    // verana.tr.v1
    ["/verana.tr.v1.MsgCreateTrustRegistry", MsgCreateTrustRegistry],
    ["/verana.tr.v1.MsgUpdateTrustRegistry", MsgUpdateTrustRegistry],
    ["/verana.tr.v1.MsgArchiveTrustRegistry", MsgArchiveTrustRegistry],
]);
  
export const veranaAmino = new AminoTypes({
    // verana.dd.v1
    '/verana.dd.v1.MsgAddDID': MsgAddDIDAminoConverter,
    '/verana.dd.v1.MsgRenewDID': MsgRenewDIDAminoConverter,
    '/verana.dd.v1.MsgTouchDID': MsgTouchDIDAminoConverter,
    '/verana.dd.v1.MsgRemoveDID': MsgRemoveDIDAminoConverter,
    // verana.td.v1
    '/verana.td.v1.MsgReclaimTrustDepositYield': MsgReclaimTrustDepositYieldAminoConverter,
    '/verana.td.v1.MsgReclaimTrustDeposit': MsgReclaimTrustDepositAminoConverter,
    '/verana.td.v1.MsgRepaySlashedTrustDeposit': MsgRepaySlashedTrustDepositAminoConverter,
    // verana.tr.v1
    '/verana.tr.v1.MsgCreateTrustRegistry': MsgCreateTrustRegistryAminoConverter,
    '/verana.tr.v1.MsgUpdateTrustRegistry': MsgUpdateTrustRegistryAminoConverter,
    '/verana.tr.v1.MsgArchiveTrustRegistry': MsgArchiveTrustRegistryAminoConverter,
    // '/verana.tr.v1.MsgAddGovernanceFrameworkDocument': MsgAddGovernanceFrameworkDocumentAminoConverter,
    // '/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion': MsgIncreaseActiveGovernanceFrameworkVersionAminoConverter,
});

export const veranaGasPrice = GasPrice.fromString("3uvna");
export const veranaGasLimit = 300000; 

// *************************

// export const veranaChainKeplrWalletType: ChainInfo = {
//   chainId: env('NEXT_PUBLIC_VERANA_CHAIN_ID')!,
//   chainName: env('NEXT_PUBLIC_VERANA_CHAIN_NAME')!,
//   rpc: env('NEXT_PUBLIC_VERANA_RPC_ENDPOINT')!,
//   rest: env('NEXT_PUBLIC_VERANA_RPC_ENDPOINT')!,
//   bip44: {
//     coinType: 118,
//   },
//   bech32Config: {
//     bech32PrefixAccAddr: "verana",
//     bech32PrefixAccPub: "veranapub",
//     bech32PrefixValAddr: "veranavaloper",
//     bech32PrefixValPub: "veranavaloperpub",
//     bech32PrefixConsAddr: "veranavalcons",
//     bech32PrefixConsPub: "veranavalconspub",
//   },
//   currencies: [
//     {
//       coinDenom: "VNA",
//       coinMinimalDenom: "uvna",
//       coinDecimals: 6,
//     },
//   ],
//   feeCurrencies: [
//     {
//       coinDenom: "VNA",
//       coinMinimalDenom: "uvna",
//       coinDecimals: 6,
//     },
//   ],
//   stakeCurrency: {
//     coinDenom: "VNA",
//     coinMinimalDenom: "uvna",
//     coinDecimals: 6,
//   },
// };


// export const CHAIN_INFO = {
//   chainId: "CHAIN_ID",
//   chainName: "Verana Testnet",
//   rpc: "RPC_ENDPOINT",
//   rest: "REST_ENDPOINT",
//   bip44: {
//     coinType: 118,
//   },
//   bech32Config: {
//     bech32PrefixAccAddr: "verana",
//     bech32PrefixAccPub: "veranapub",
//     bech32PrefixValAddr: "veranavaloper",
//     bech32PrefixValPub: "veranavaloperpub",
//     bech32PrefixConsAddr: "veranavalcons",
//     bech32PrefixConsPub: "veranavalconspub",
//   },
//   currencies: [
//     {
//       coinDenom: "VNA",
//       coinMinimalDenom: "uvna",
//       coinDecimals: 6,
//     },
//   ],
//   feeCurrencies: [
//     {
//       coinDenom: "VNA",
//       coinMinimalDenom: "uvna",
//       coinDecimals: 6,
//     },
//   ],
//   stakeCurrency: {
//     coinDenom: "VNA",
//     coinMinimalDenom: "uvna",
//     coinDecimals: 6,
//   },
//   gasPriceStep: {
//     low: 1,
//     average: 3,
//     high: 4,
//   },
// };

