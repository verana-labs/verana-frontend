'use client'

import { EncodeObject, OfflineSigner as OfflineSignerAmino } from '@cosmjs/proto-signing'
import { calculateFee, DeliverTxResponse, GasPrice, SigningStargateClient, StdFee } from '@cosmjs/stargate'
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { veranaAmino, veranaRegistry } from '@/config/veranaChain.sign.client'
import { logger } from '@/lib/logger'
import { expectedSequence, isBroadcastSequenceMismatch, isSequenceMismatch } from '@/msg/util/sequence-mismatch'

type AminoSignOptions = {
  rpcEndpoint: string
  signer: OfflineSignerAmino // Signer AMINO (getOfflineSignerOnlyAmino)
  address: string // Bech32 address of signer
  messages: EncodeObject[] // [{ typeUrl, value }]
  gasPrice: string // "0.3uvna"
  gasAdjustment?: number // e.g. 1.2 (20% safety buffer)
  memo?: string // Optional memo
  simulate?: boolean // NEW: default false
  fee?: StdFee
}

export type SimulateResult = StdFee

export async function signAndBroadcastManualAmino({
  rpcEndpoint,
  signer,
  address,
  messages,
  gasPrice,
  gasAdjustment = 1.5,
  memo = '',
  simulate = false,
  fee: givenFee,
}: AminoSignOptions): Promise<DeliverTxResponse | SimulateResult> {
  // Connect a client — only used for simulate and broadcast
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, {
    aminoTypes: veranaAmino,
    registry: veranaRegistry,
    gasPrice: GasPrice.fromString(gasPrice),
  })
  const chainId = await client.getChainId()

  let { accountNumber, sequence } = await client.getSequence(address)
  logger.log('{ accountNumber, sequence }', { accountNumber, sequence })

  let fee = givenFee
  if (!fee) {
    // Simulate gas usage for the messages
    let simulated = 300000
    try {
      simulated = await client.simulate(address, messages, memo)
    } catch (e) {
      if (isSequenceMismatch(e)) logger.error('Simulated Tx: ', e)
      throw e
    }
    fee = calculateFee(Math.ceil(simulated * gasAdjustment), GasPrice.fromString(gasPrice))
  }

  // If only simulating, return the computed fee before signing/broadcasting
  if (simulate) return fee

  // sign + broadcast (retry once on sequence mismatch) ----
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      logger.log('{ attempt, sequence }', { attempt, sequence })
      const txRaw = await client.sign(address, messages, fee, memo, {
        accountNumber,
        sequence,
        chainId,
      })
      const txBytes = TxRaw.encode(txRaw).finish()
      return await client.broadcastTx(txBytes)
    } catch (e) {
      if (isBroadcastSequenceMismatch(e) && attempt === 0) {
        logger.error('Tx: ', e)
        sequence = expectedSequence(e) ?? (await client.getSequence(address)).sequence
        continue
      }
      throw e
    }
  }

  throw new Error('Sequence mismatch after retry')
}
