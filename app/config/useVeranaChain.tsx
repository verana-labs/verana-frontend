'use client';

import { Chain } from '@chain-registry/types';
import { env } from 'next-runtime-env';
import { veranaChainEnv } from '@/app/config/veranachain';

export function useVeranaChain() {

    const chainName = env('NEXT_PUBLIC_VERANA_CHAIN_NAME');
    const chainId = env('NEXT_PUBLIC_VERANA_CHAIN_ID');
    const rpc = env('NEXT_PUBLIC_VERANA_RPC_ENDPOINT');
    const rest = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT');
    // console.log('[veranaChainEnv]', veranaChainEnv);
    // console.info(`chainName: ${chainName} chainId: ${chainId} rpc: ${rpc} rest: ${rest}`);

    if (chainName && chainId && rpc && rest) {
        return {
                ...veranaChainEnv,
                chain_name: chainName,
                pretty_name: chainName,
                chain_id: chainId,
                apis: {
                rpc: [{ address:  rpc, provider: 'verana' }],
                rest: [{ address:  rest, provider: 'verana' }],
                },
        } as Chain;
    }
    else return veranaChainEnv as Chain;
}