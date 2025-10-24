'use client'

import { fromBase64 } from '@cosmjs/encoding';
import { MsgArchiveCredentialSchema, MsgCreateCredentialSchema, MsgUpdateCredentialSchema } from 'proto-codecs/codec/verana/cs/v1/tx';
import {
  EncodeObject,
  Registry,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
  OfflineDirectSigner,
} from '@cosmjs/proto-signing';
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { calculateFee, DeliverTxResponse, GasPrice, SigningStargateClient } from '@cosmjs/stargate';
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import Long from 'long';
import { MsgAddDID, MsgRemoveDID, MsgRenewDID, MsgTouchDID } from 'proto-codecs/codec/verana/dd/v1/tx';
import { MsgReclaimTrustDeposit, MsgRepaySlashedTrustDeposit } from 'proto-codecs/codec/verana/td/v1/tx';
import { MsgAddGovernanceFrameworkDocument, MsgArchiveTrustRegistry, MsgCreateTrustRegistry, MsgIncreaseActiveGovernanceFrameworkVersion, MsgUpdateTrustRegistry } from 'proto-codecs/codec/verana/tr/v1/tx';

// Register your custom protobuf message types in a Registry
export function makeRegistry(): Registry {
  const registry = new Registry();
    // verana.dd.v1
    registry.register('/verana.dd.v1.MsgAddDID', MsgAddDID);
    registry.register('/verana.dd.v1.MsgRenewDID', MsgRenewDID);
    registry.register('/verana.dd.v1.MsgTouchDID', MsgTouchDID);
    registry.register('/verana.dd.v1.MsgRemoveDID', MsgRemoveDID);
    // verana.td.v1
    registry.register('/verana.td.v1.MsgReclaimTrustDeposit', MsgReclaimTrustDeposit);
    registry.register('/verana.td.v1.MsgRepaySlashedTrustDeposit', MsgRepaySlashedTrustDeposit);
    // verana.tr.v1
    registry.register('/verana.tr.v1.MsgCreateTrustRegistry', MsgCreateTrustRegistry);
    registry.register('/verana.tr.v1.MsgUpdateTrustRegistry', MsgUpdateTrustRegistry);
    registry.register('/verana.tr.v1.MsgArchiveTrustRegistry', MsgArchiveTrustRegistry);
    registry.register('/verana.tr.v1.MsgAddGovernanceFrameworkDocument', MsgAddGovernanceFrameworkDocument);
    registry.register('/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion', MsgIncreaseActiveGovernanceFrameworkVersion);
    // verana.cs.v1
    registry.register('/verana.cs.v1.MsgCreateCredentialSchema', MsgCreateCredentialSchema);
    registry.register('/verana.cs.v1.MsgUpdateCredentialSchema', MsgUpdateCredentialSchema);
    registry.register('/verana.cs.v1.MsgArchiveCredentialSchema', MsgArchiveCredentialSchema);
    return registry;
}

type ManualSignOptions = {
  rpcEndpoint: string;
  chainId: string;
  signer: OfflineDirectSigner;   // Direct signer (Keplr/Leap/etc.)
  address: string;               // Bech32 address of signer
  registry: Registry;            // Registry with your types
  messages: EncodeObject[];      // [{ typeUrl, value }]
  gasPrice: string;              // "0.3uvna"
  gasAdjustment?: number;        // e.g. 1.2 (20% safety buffer)
  memo?: string;                 // Optional memo
  timeoutHeight?: number | Long; // Optional timeout
  // feeGranter?: string;           // Feegrant (optional)
  // feePayer?: string;             // Fee payer (optional)
};

export async function signAndBroadcastManualDirect({
  rpcEndpoint,
  chainId,
  signer,
  address,
  registry,
  messages,
  gasPrice,
  gasAdjustment = 2,
  memo = '',
  timeoutHeight,
  // feeGranter,
  // feePayer,
}: ManualSignOptions): Promise<DeliverTxResponse> {
  // Connect a client — only used for simulate and broadcast
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, { registry });

  // Simulate gas usage for the messages
  const simulated = await client.simulate(address, messages, memo);
  const gasLimit = Math.ceil(simulated * gasAdjustment);
  const fee = calculateFee(gasLimit, GasPrice.fromString(gasPrice));

  // Create TxBody with your messages
  const body = TxBody.fromPartial({
    messages: messages.map(m => registry.encodeAsAny(m)),
    memo,
    timeoutHeight: timeoutHeight === undefined
        ? undefined
        : BigInt(timeoutHeight instanceof Long ? timeoutHeight.toString() : timeoutHeight),
  });
  const bodyBytes = TxBody.encode(body).finish();

  // Fetch account sequence & accountNumber
  const { accountNumber, sequence } = await client.getSequence(address);

  // Get pubkey from signer
  const accounts = await signer.getAccounts();
  const aminoPubkey = encodeSecp256k1Pubkey(accounts[0].pubkey); // ✅ base64 string
  const protoPubkey = encodePubkey(aminoPubkey);                 // ✅ Any

  // Build AuthInfo
  const authInfoBytes = makeAuthInfoBytes(
    [{ pubkey: protoPubkey, sequence }],
    fee.amount,
    gasLimit,
    /* feeGranter */ undefined,
    /* feePayer   */ undefined
  );

  // Build SignDoc and sign manually
  const signDoc = makeSignDoc(bodyBytes, authInfoBytes, chainId, accountNumber);
  const { signature } = await signer.signDirect(address, signDoc);

  const sigBytes = typeof signature.signature === 'string'
    ? fromBase64(signature.signature)
    : signature.signature;

  // Build TxRaw
  const txRaw: TxRaw = {
    bodyBytes,
    authInfoBytes,
    signatures: [sigBytes],
  };

  // Broadcast the tx
  const txBytes = TxRaw.encode(txRaw).finish();
  return client.broadcastTx(txBytes);
}