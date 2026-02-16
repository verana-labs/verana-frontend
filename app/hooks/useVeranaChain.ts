'use client';

import { Chain } from '@chain-registry/types';
import { env } from 'next-runtime-env';
import { veranaChainBase } from '@/config/veranaChain.client';

export function useVeranaChain() {
    const chainName = env('NEXT_PUBLIC_VERANA_CHAIN_NAME');
    const chainId = env('NEXT_PUBLIC_VERANA_CHAIN_ID');
    const rpc = env('NEXT_PUBLIC_VERANA_RPC_ENDPOINT');
    const rest = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT');

    if (chainName && chainId && rpc && rest) {
        return {
            ...veranaChainBase,
            chain_name: chainName,
            pretty_name: chainName,
            chain_id: chainId,
            apis: {
                rpc: [{ address: rpc, provider: 'verana' }],
                rest: [{ address: rest, provider: 'verana' }],
            },
        } as Chain;
    }

    return veranaChainBase as Chain;
}