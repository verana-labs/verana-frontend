import { Chain, Asset } from '@chain-registry/types';
import { GasPrice, defaultRegistryTypes, AminoTypes } from "@cosmjs/stargate";
import { Registry } from '@cosmjs/proto-signing'
import { MsgAddDID, MsgRemoveDID, MsgRenewDID, MsgTouchDID } from '@/app/proto-codecs/codec/veranablockchain/diddirectory/tx';
import { MsgAddDIDAminoConverter, MsgRenewDIDAminoConverter, MsgTouchDIDAminoConverter, MsgRemoveDIDAminoConverter } from '@/app/msg/aminoconverter/aminoConvertersDID';
import { MsgReclaimTrustDeposit, MsgReclaimTrustDepositInterests } from '@/app/proto-codecs/codec/veranablockchain/trustdeposit/tx';
import { MsgReclaimTrustDepositInterestsAminoConverter, MsgReclaimTrustDepositAminoConverter } from '@/app//msg/aminoconverter/aminoConvertersTD';

export const veranaChain: Chain = {
  chain_type: 'bip122',
  chain_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,
  pretty_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,
  chain_id: process.env.NEXT_PUBLIC_VERANA_CHAIN_ID!,//
  apis: {
    rpc: [{ address: process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT!, provider: 'verana' }],
    rest: [{ address: process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT!, provider: 'verana' }],

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

export const veranaRegistry = new Registry([
  ...defaultRegistryTypes,
  ["/veranablockchain.diddirectory.MsgAddDID", MsgAddDID],
  ["/veranablockchain.diddirectory.MsgRenewDID", MsgRenewDID],
  ["/veranablockchain.diddirectory.MsgTouchDID", MsgTouchDID],
  ["/veranablockchain.diddirectory.MsgRemoveDID", MsgRemoveDID],
  ["/veranablockchain.trustdeposit.MsgReclaimTrustDeposit", MsgReclaimTrustDeposit],
  ["/veranablockchain.trustdeposit.MsgReclaimTrustDepositInterests", MsgReclaimTrustDepositInterests],
])
  
export const veranaAmino = new AminoTypes({
    '/veranablockchain.diddirectory.MsgAddDID': MsgAddDIDAminoConverter,
    '/veranablockchain.diddirectory.MsgRenewDID': MsgRenewDIDAminoConverter,
    '/veranablockchain.diddirectory.MsgTouchDID': MsgTouchDIDAminoConverter,
    '/veranablockchain.diddirectory.MsgRemoveDID': MsgRemoveDIDAminoConverter,
    '/veranablockchain.trustdeposit.MsgReclaimTrustDeposit': MsgReclaimTrustDepositAminoConverter,
    '/veranablockchain.trustdeposit.MsgReclaimTrustDepositInterests': MsgReclaimTrustDepositInterestsAminoConverter,
  });

export const veranaGasPrice = GasPrice.fromString("3uvna");
export const veranaGasLimit = 300000; 





