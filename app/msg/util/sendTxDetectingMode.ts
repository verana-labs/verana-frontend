'use client'

import { Chain } from '@chain-registry/types'
import type { EncodeObject } from '@cosmjs/proto-signing'
import { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { env } from 'next-runtime-env'
import { useCallback } from 'react'
import { veranaGasAdjustment, veranaGasPrice, veranaRegistry } from '@/config/veranaChain.sign.client'
import { useCalculateFee } from '@/hooks/useCalculateFee'
import { logger } from '@/lib/logger'
import { SimulateResult, signAndBroadcastManualAmino } from '@/msg/util//signAndBroadcastManualAmino'
import { signAndBroadcastManualDirect } from '@/msg/util/signAndBroadcastManualDirect'
import { isAminoOnlySigner, isDirectSigner } from '@/msg/util/signerUtil'

type SendTxParams = { msgs: EncodeObject[]; memo?: string; simulate?: boolean }

export function useSendTxDetectingMode(chain: Chain) {
  const { address, getOfflineSignerDirect, getOfflineSignerAmino, getRpcEndpoint, isWalletConnected } = useChain(
    chain.chain_name
  )

  return useCallback(
    async (params: SendTxParams): Promise<DeliverTxResponse | SimulateResult> => {
      const { msgs, memo = '', simulate = false } = params
      const safeMemo = typeof memo === 'string' ? memo : String(memo ?? '')

      if (!isWalletConnected || !address) {
        throw new Error('Wallet not connected')
      }

      // Resolve RPC (string | ExtendedHttpEndpoint -> string)
      const rpcRaw = await getRpcEndpoint()
      const rpcEndpoint =
        typeof rpcRaw === 'string'
          ? rpcRaw
          : // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
            rpcRaw && typeof (rpcRaw as any).url === 'string'
            ? // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
              (rpcRaw as any).url
            : // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
              (rpcRaw as any)?.address

      if (!rpcEndpoint) {
        throw new Error('RPC endpoint not available')
      }

      const veranaDirectMode =
        env('NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE') || process.env.NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE

      // Get signer from cosmos-kit (multi-wallet safe)
      const signer =
        veranaDirectMode && veranaDirectMode === 'true'
          ? ((await getOfflineSignerDirect?.()) ?? (await getOfflineSignerAmino?.()))
          : await getOfflineSignerAmino?.()

      if (!signer) {
        throw new Error('No signer from wallet')
      }

      // --- DIRECT PATH (manual flow) ---
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
          })
        } catch (e) {
          throw new Error(`Direct signing failed: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      // --- AMINO PATH (fallback) ---
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
            return useCalculateFee().fee as SimulateResult
          }
          throw error
        }
      }

      throw new Error('Signer does not support Direct or Amino')
    },
    [address, getRpcEndpoint, getOfflineSignerDirect, getOfflineSignerAmino, isWalletConnected, chain?.chain_id]
  )
}
