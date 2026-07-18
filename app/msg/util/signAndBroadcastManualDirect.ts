'use client'

import { encodeSecp256k1Pubkey } from '@cosmjs/amino'
import { fromBase64, toHex } from '@cosmjs/encoding'
import {
  EncodeObject,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
  OfflineDirectSigner,
  Registry,
} from '@cosmjs/proto-signing'
import { calculateFee, DeliverTxResponse, GasPrice, SigningStargateClient } from '@cosmjs/stargate'
import { createVeranaRegistry } from '@verana-labs/verana-types'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import Long from 'long'
import { logger } from '@/lib/logger'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'

export function makeRegistry(): Registry {
  return createVeranaRegistry()
}

type ManualSignOptions = {
  rpcEndpoint: string
  chainId: string
  signer: OfflineDirectSigner // Direct signer (Keplr/Leap/etc.)
  address: string // Bech32 address of signer
  registry: Registry // Registry with your types
  messages: EncodeObject[] // [{ typeUrl, value }]
  gasPrice: string // "0.3uvna"
  gasAdjustment?: number // e.g. 1.2 (20% safety buffer)
  memo?: string // Optional memo
  timeoutHeight?: number | Long // Optional timeout
  simulate?: boolean
  // feeGranter?: string;           // Feegrant (optional)
  // feePayer?: string;             // Fee payer (optional)
}

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
  simulate = false,
  // feeGranter,
  // feePayer,
}: ManualSignOptions): Promise<DeliverTxResponse | SimulateResult> {
  const anys = messages.map((m) => registry.encodeAsAny(m))
  logger.log('Any.typeUrl:', anys[0].typeUrl)
  logger.log('Any.value(hex):', toHex(anys[0].value))

  // Connect a client — only used for simulate and broadcast
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, { registry })

  // Simulate gas usage for the messages
  const simulated = await client.simulate(address, messages, memo)
  const gasLimit = Math.ceil(simulated * gasAdjustment)
  const fee = calculateFee(gasLimit, GasPrice.fromString(gasPrice))
  if (simulate) return fee

  // Create TxBody with your messages
  const body = TxBody.fromPartial({
    messages: messages.map((m) => registry.encodeAsAny(m)),
    memo,
    timeoutHeight:
      timeoutHeight === undefined
        ? undefined
        : BigInt(timeoutHeight instanceof Long ? timeoutHeight.toString() : timeoutHeight),
  })
  const bodyBytes = TxBody.encode(body).finish()

  // Fetch account sequence & accountNumber
  const { accountNumber, sequence } = await client.getSequence(address)

  // Get pubkey from signer
  const accounts = await signer.getAccounts()
  const aminoPubkey = encodeSecp256k1Pubkey(accounts[0].pubkey) // ✅ base64 string
  const protoPubkey = encodePubkey(aminoPubkey) // ✅ Any

  // Build AuthInfo
  const authInfoBytes = makeAuthInfoBytes(
    [{ pubkey: protoPubkey, sequence }],
    fee.amount,
    gasLimit,
    /* feeGranter */ undefined,
    /* feePayer   */ undefined
  )

  // Build SignDoc and sign manually
  const signDoc = makeSignDoc(bodyBytes, authInfoBytes, chainId, accountNumber)
  const { signature } = await signer.signDirect(address, signDoc)

  const sigBytes = typeof signature.signature === 'string' ? fromBase64(signature.signature) : signature.signature

  // Build TxRaw
  const txRaw: TxRaw = {
    bodyBytes,
    authInfoBytes,
    signatures: [sigBytes],
  }

  // Broadcast the tx
  const txBytes = TxRaw.encode(txRaw).finish()
  return client.broadcastTx(txBytes)
}
