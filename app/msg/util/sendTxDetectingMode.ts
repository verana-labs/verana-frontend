'use client';

import { useCallback } from 'react';
import { DeliverTxResponse } from '@cosmjs/stargate';
import type { EncodeObject } from '@cosmjs/proto-signing';
import { isDirectSigner, isAminoOnlySigner } from '@/msg/util/signerUtil';
import { signAndBroadcastManualDirect } from '@/msg/util/signAndBroadcastManualDirect';
import { signAndBroadcastManualAmino } from '@/msg/util//signAndBroadcastManualAmino';
import { veranaGasAdjustment, veranaGasPrice, veranaRegistry } from '@/config/veranaChain.sign.client';
import { useChain } from '@cosmos-kit/react';
import { Chain } from '@chain-registry/types';
import { env } from 'next-runtime-env';

export function useSendTxDetectingMode(chain: Chain) {
  const { address, getOfflineSignerDirect, getOfflineSignerAmino, getRpcEndpoint, isWalletConnected } = useChain(chain.chain_name);

  return useCallback(async (params: { msgs: EncodeObject[]; memo?: string }): Promise<DeliverTxResponse> => {
    const { msgs, memo = '' } = params;
    const safeMemo = typeof memo === 'string' ? memo : String(memo ?? '');

    if (!isWalletConnected || !address) {
      throw new Error('Wallet not connected');
    }

    // Resolve RPC (string | ExtendedHttpEndpoint -> string)
    const rpcRaw = await getRpcEndpoint();
    const rpcEndpoint =
        typeof rpcRaw === 'string'
        ? rpcRaw
        : (rpcRaw && typeof (rpcRaw as any).url === 'string') // eslint-disable-line @typescript-eslint/no-explicit-any
            ? (rpcRaw as any).url // eslint-disable-line @typescript-eslint/no-explicit-any
            : (rpcRaw as any)?.address; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!rpcEndpoint) {
      throw new Error('RPC endpoint not available');
    }

    const veranaDirectMode = 
        env('NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE') ||
        process.env.NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE;
    
    // Get signer from cosmos-kit (multi-wallet safe)
    const signer = (veranaDirectMode && veranaDirectMode==='true')
        ? (await getOfflineSignerDirect?.()) ?? (await getOfflineSignerAmino?.())
        : await getOfflineSignerAmino?.();

    if (!signer) {
        throw new Error('No signer from wallet');
    }

    // --- DIRECT PATH (manual flow) ---
    if (isDirectSigner(signer)) {
      console.info('*** Using DIRECT signer → manual flow ***');
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
        });
      } catch (e) {
        throw new Error(`Direct signing failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // --- AMINO PATH (fallback) ---
    if (isAminoOnlySigner(signer)) {
      console.info('*** Using AMINO signer → fallback ***');
      try {
        return await signAndBroadcastManualAmino({
          rpcEndpoint,
          signer,
          address,
          messages: msgs,
          gasPrice: veranaGasPrice,
          gasAdjustment: veranaGasAdjustment,
          memo: safeMemo,
        });
      } catch (e) {
        throw new Error(`Amino signing failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    throw new Error('Signer does not support Direct or Amino');
  }, [address, getRpcEndpoint, getOfflineSignerDirect, getOfflineSignerAmino, isWalletConnected, chain?.chain_id]);
}