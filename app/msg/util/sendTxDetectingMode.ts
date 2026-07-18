'use client'

import type { Chain } from '@chain-registry/types'
import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { useCallback } from 'react'
import { VERANA_SIGN_DIRECT_MODE } from '@/config/env'
import { veranaGasAdjustment, veranaGasPrice, veranaRegistry } from '@/config/veranaChain.sign.client'
import { useCalculateFee } from '@/hooks/useCalculateFee'
import { logger } from '@/lib/logger'
import { type SimulateResult, signAndBroadcastManualAmino } from '@/msg/util/signAndBroadcastManualAmino'
import { signAndBroadcastManualDirect } from '@/msg/util/signAndBroadcastManualDirect'
import { isAminoOnlySigner, isDirectSigner } from '@/msg/util/signerUtil'

type SendTxParams = { msgs: EncodeObject[]; memo?: string; simulate?: boolean }

function resolveRpcEndpoint(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value !== 'object' || value === null) return undefined

  const endpoint = value as Record<string, unknown>
  if (typeof endpoint.url === 'string') return endpoint.url
  return typeof endpoint.address === 'string' ? endpoint.address : undefined
}

export function useSendTxDetectingMode(chain: Chain) {
  const { address, getOfflineSignerDirect, getOfflineSignerAmino, getRpcEndpoint, isWalletConnected } = useChain(
    chain.chain_name
  )
  const { fee: fallbackSimulationFee } = useCalculateFee()

  return useCallback(
    async (params: SendTxParams): Promise<DeliverTxResponse | SimulateResult> => {
      const { msgs, memo = '', simulate = false } = params
      const safeMemo = typeof memo === 'string' ? memo : String(memo ?? '')

      if (!isWalletConnected || !address) {
        throw new Error('Wallet not connected')
      }

      const rpcEndpoint = resolveRpcEndpoint(await getRpcEndpoint())

      if (!rpcEndpoint) {
        throw new Error('RPC endpoint not available')
      }

      const signer =
        VERANA_SIGN_DIRECT_MODE === 'true'
          ? ((await getOfflineSignerDirect?.()) ?? (await getOfflineSignerAmino?.()))
          : await getOfflineSignerAmino?.()

      if (!signer) {
        throw new Error('No signer from wallet')
      }

      if (isDirectSigner(signer)) {
        logger.info('*** Using DIRECT signer → manual flow ***')
        try {
          return await signAndBroadcastManualDirect({
            rpcEndpoint,
            chainId: chain.chain_id,
            signer,
            address,
            registry: veranaRegistry,
            messages: msgs,
            gasPrice: veranaGasPrice,
            gasAdjustment: veranaGasAdjustment,
            memo: safeMemo,
            simulate,
          })
        } catch (e) {
          throw new Error(`Direct signing failed: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      if (isAminoOnlySigner(signer)) {
        logger.info('*** Using AMINO signer → fallback ***')
        try {
          return await signAndBroadcastManualAmino({
            rpcEndpoint,
            signer,
            address,
            messages: msgs,
            gasPrice: veranaGasPrice,
            gasAdjustment: veranaGasAdjustment,
            memo: safeMemo,
            simulate,
          })
        } catch (e) {
          const error = new Error(`Amino signing failed: ${e instanceof Error ? e.message : String(e)}`)
          if (simulate) {
            logger.error('signAndBroadcastManualAmino', error)
            return fallbackSimulationFee as SimulateResult
          }
          throw error
        }
      }

      throw new Error('Signer does not support Direct or Amino')
    },
    [
      address,
      chain.chain_id,
      fallbackSimulationFee,
      getOfflineSignerAmino,
      getOfflineSignerDirect,
      getRpcEndpoint,
      isWalletConnected,
    ]
  )
}
