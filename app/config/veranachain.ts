import { Chain, Asset } from '@chain-registry/types';
import { Registry } from "@cosmjs/proto-signing";
import { GasPrice, defaultRegistryTypes, AminoTypes } from "@cosmjs/stargate";
import { 
  MsgAddDID,
  MsgRemoveDID,
  MsgTouchDID,
  MsgRenewDID 
} from "@/app/proto-codecs/codec/veranablockchain/diddirectory/tx";
import { MsgAddDIDAminoConverter } from '../proto-codecs/codec/veranablockchain/diddirectory/aminoConverters';

export const veranaChain: Chain = {
  chain_type: 'bip122',
  chain_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,
  pretty_name: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME!,
  chain_id: process.env.NEXT_PUBLIC_VERANA_CHAIN_ID!,//
  apis: {
    rpc: [{ address: process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT!,// ? process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT : 'https://rpc.testnet.verana.network',
        provider: 'verana' }],
    rest: [{ address: process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT!,// ? process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT : 'https://api.testnet.verana.network',
        provider: 'verana' }],

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

export const GAS_PRICE = GasPrice.fromString("0.025uvna");

export function getSigningVeranaClientOptions() {
  const registry = new Registry([...defaultRegistryTypes]);
  // Register all message types
  registry.register("/veranablockchain.diddirectory.MsgAddDID", MsgAddDID);
  registry.register("/veranablockchain.diddirectory.MsgRemoveDID", MsgRemoveDID);
  registry.register("/veranablockchain.diddirectory.MsgTouchDID", MsgTouchDID);
  registry.register("/veranablockchain.diddirectory.MsgRenewDID", MsgRenewDID);
  
  const aminoTypes = new AminoTypes({
    '/veranablockchain.diddirectory.MsgAddDID': MsgAddDIDAminoConverter,
  });

  return {
    registry,
    // disableAmino: true  
    aminoTypes
  };
}
