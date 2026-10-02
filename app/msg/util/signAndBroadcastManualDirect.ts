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
import { calculateFee, DeliverTxResponse, GasPrice, SigningStargateClient, StdFee } from '@cosmjs/stargate'
import { createVeranaRegistry } from '@verana-labs/verana-types'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import Long from 'long'
import { logger } from '@/lib/logger'
import { expectedSequence, isSequenceMismatch } from '@/msg/util/sequence-mismatch'
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
  fee?: StdFee
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
  fee: givenFee,
}: ManualSignOptions): Promise<DeliverTxResponse | SimulateResult> {
  const anys = messages.map((m) => registry.encodeAsAny(m))
  logger.log('Any.typeUrl:', anys[0].typeUrl)
  logger.log('Any.value(hex):', toHex(anys[0].value))

  // Connect a client — only used for simulate and broadcast
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, { registry })

  let fee = givenFee
  if (!fee) {
    // Simulate gas usage for the messages
    const simulated = await client.simulate(address, messages, memo)
    fee = calculateFee(Math.ceil(simulated * gasAdjustment), GasPrice.fromString(gasPrice))
  }
  if (simulate) return fee
  const signedFee = fee

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

  const { accountNumber, sequence } = await client.getSequence(address)

  const accounts = await signer.getAccounts()
  const protoPubkey = encodePubkey(encodeSecp256k1Pubkey(accounts[0].pubkey))

  async function signAndBroadcast(signingSequence: number): Promise<DeliverTxResponse> {
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey: protoPubkey, sequence: signingSequence }],
      signedFee.amount,
      Number(signedFee.gas),
      signedFee.granter,
      undefined
    )
    const signDoc = makeSignDoc(bodyBytes, authInfoBytes, chainId, accountNumber)
    const { signature } = await signer.signDirect(address, signDoc)
    const sigBytes = typeof signature.signature === 'string' ? fromBase64(signature.signature) : signature.signature
    const txRaw: TxRaw = { bodyBytes, authInfoBytes, signatures: [sigBytes] }
    return client.broadcastTx(TxRaw.encode(txRaw).finish())
  }

  try {
    return await signAndBroadcast(sequence)
  } catch (error) {
    if (!isSequenceMismatch(error)) throw error
    logger.warn('Retrying once after an account sequence mismatch', error)
    return signAndBroadcast(expectedSequence(error) ?? (await client.getSequence(address)).sequence)
  }
}
