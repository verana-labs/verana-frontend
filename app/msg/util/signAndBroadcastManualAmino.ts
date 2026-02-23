'use client'

import {
  EncodeObject,
  OfflineSigner as OfflineSignerAmino
} from '@cosmjs/proto-signing';
import { calculateFee, DeliverTxResponse, GasPrice, SigningStargateClient } from '@cosmjs/stargate';
import { veranaAmino, veranaRegistry} from '@/config/veranaChain.sign.client';
import { MsgCreateCredentialSchema, MsgUpdateCredentialSchema } from 'proto-codecs/codec/verana/cs/v1/tx';
import { toHex } from "@cosmjs/encoding";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

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

  // const any = veranaRegistry.encodeAsAny(messages[0]);
  // debugCreateAny(any);

  // Connect a client — only used for simulate and broadcast
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, 
                  { aminoTypes: veranaAmino,
                    registry: veranaRegistry,
                    gasPrice: GasPrice.fromString(gasPrice),
                  });
  const chainId = await client.getChainId();

  let { accountNumber, sequence } = await client.getSequence(address);
  console.log("{ accountNumber, sequence }", { accountNumber, sequence });

  // Simulate gas usage for the messages
  let simulated = 300000;
  try{
    simulated = await client.simulate(address, messages, memo);
  } catch (e) {
    if (isSequenceMismatch(e)){
      console.error("Simulated Tx: ", e);
      const { expected } = parseSequenceMismatch(e);
      if (expected != null) sequence = expected;
    }
    throw e;
  }
  
  const gasLimit = Math.ceil(simulated * gasAdjustment);
  const fee = calculateFee(gasLimit, GasPrice.fromString(gasPrice));

  // sign + broadcast (retry once on sequence mismatch) ----
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log("{ attempt, sequence }", {attempt, sequence});
      const txRaw = await client.sign(address, messages, fee, memo, {
        accountNumber,
        sequence,
        chainId,
      });
      const txBytes = TxRaw.encode(txRaw).finish();
      return await client.broadcastTx(txBytes);
    } catch (e) {
      if (isSequenceMismatch(e) && attempt === 0){
        console.error("Tx: ", e);
        const { expected } = parseSequenceMismatch(e);
        if (expected != null) sequence = expected;
        continue;
      }
      throw e;
    }
  }

  throw new Error("Sequence mismatch after retry");
}

export function debugCreateAny(anyMsg: { typeUrl: string; value: Uint8Array }) {
  if (anyMsg.typeUrl !== "/verana.cs.v1.MsgCreateCredentialSchema" && anyMsg.typeUrl !== "/verana.cs.v1.MsgUpdateCredentialSchema") return;
  const decoded = anyMsg.typeUrl == "/verana.cs.v1.MsgCreateCredentialSchema" ? MsgCreateCredentialSchema.decode(anyMsg.value) : MsgUpdateCredentialSchema.decode(anyMsg.value);
  console.log("Any.typeUrl:", anyMsg.typeUrl);
  console.log("Any.value(hex):", toHex(anyMsg.value));
  console.log(`DECODED ${anyMsg.typeUrl}`, {
    issuerGrantorValidationValidityPeriod: decoded.issuerGrantorValidationValidityPeriod?.value,
    verifierGrantorValidationValidityPeriod: decoded.verifierGrantorValidationValidityPeriod?.value,
    issuerValidationValidityPeriod: decoded.issuerValidationValidityPeriod?.value,
    verifierValidationValidityPeriod: decoded.verifierValidationValidityPeriod?.value,
    holderValidationValidityPeriod: decoded.holderValidationValidityPeriod?.value,
  });
}

function isSequenceMismatch(e: unknown): boolean {
  const m = String((e as any)?.message ?? e);
  return m.includes("account sequence mismatch") || m.includes("incorrect account sequence");
}

function parseSequenceMismatch(err: unknown): { expected?: number; got?: number } {
  const msg = String((err as any)?.message ?? err);
  const m = msg.match(/expected\s+(\d+)\s*,\s*got\s+(\d+)/i);
  if (!m) return {};
  return {
    expected: Number(m[1]),
    got: Number(m[2]),
  };
}
