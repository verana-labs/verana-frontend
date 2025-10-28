'use client'

import {
  EncodeObject,
  OfflineSigner as OfflineSignerAmino
} from '@cosmjs/proto-signing';
import { calculateFee, DeliverTxResponse, GasPrice, SigningStargateClient } from '@cosmjs/stargate';
import { veranaAmino, veranaRegistry} from '@/config/veranaChain.sign.client';
import { debugAminoRoundTrip } from '@/msg/util/debugAminoRoundTrip';

type AminoSignOptions = {
  rpcEndpoint: string;
  signer: OfflineSignerAmino;    // Signer AMINO (getOfflineSignerOnlyAmino)
  address: string;               // Bech32 address of signer
  messages: EncodeObject[];      // [{ typeUrl, value }]
  gasPrice: string;              // "0.3uvna"
  gasAdjustment?: number;        // e.g. 1.2 (20% safety buffer)
  memo?: string;                 // Optional memo
};

export async function signAndBroadcastManualAmino({
  rpcEndpoint,
  signer,
  address,
  messages,
  gasPrice,
  gasAdjustment = 1.5,
  memo = '',
}: AminoSignOptions): Promise<DeliverTxResponse> {

  debugAminoRoundTrip(messages[0]);

  // Connect a client — only used for simulate and broadcast
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, 
                  { aminoTypes: veranaAmino,
                    registry: veranaRegistry,
                    gasPrice: GasPrice.fromString(gasPrice),
                  });

  // Simulate gas usage for the messages
  const simulated = await client.simulate(address, messages, memo);
  const gasLimit = Math.ceil(simulated * gasAdjustment);
  const fee = calculateFee(gasLimit, GasPrice.fromString(gasPrice));

  // Fetch account sequence & accountNumber
  await client.getSequence(address);

  let res = await client.signAndBroadcast(address, messages, fee, memo);
  if (res.code === 0) return res;

  const unauthorized = res.code === 4 && typeof res.rawLog === 'string' && res.rawLog.includes('signature verification failed');
  if (unauthorized) {
    await client.getSequence(address); 
    res = await client.signAndBroadcast(address, messages, fee, memo); 
  }
  return res;
}