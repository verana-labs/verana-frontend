'use client';

import { env } from 'next-runtime-env';
import { useEffect } from 'react';
import { veranaChainEnv } from '@/app/config/veranachain';
import { Chain } from '@chain-registry/types';

export function useVeranaChainHook() {

    console.log('[veranaChainEnv]', veranaChainEnv);
    let veranaChain;

    useEffect(() => {
        const chainName = env('NEXT_PUBLIC_VERANA_CHAIN_NAME');
        const chainId = env('NEXT_PUBLIC_VERANA_CHAIN_ID');
        const rpc = env('NEXT_PUBLIC_VERANA_RPC_ENDPOINT');
        const rest = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT');
        console.info(`chainName: ${chainName} chainId: ${chainId} rpc: ${rpc} rest: ${rest}`);

        if (chainName && chainId && rpc && rest) {
            veranaChain =  {
                ...veranaChainEnv,
                chain_type: 'cosmos',
                chain_name: chainName,
                pretty_name: chainName,
                chain_id: chainId,
                apis: {
                rpc: [{ address:  rpc, provider: 'verana' }],
                rest: [{ address:  rest, provider: 'verana' }],
                },
            } as Chain;
        }
        else veranaChain = veranaChainEnv as Chain;
    });

    console.log('[veranaChain]', veranaChain);
    return veranaChain;
}