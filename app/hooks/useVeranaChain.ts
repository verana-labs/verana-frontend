'use client';

import { Chain } from '@chain-registry/types';
import { veranaChainEnv } from '@/config/veranaChain.client';
import { getPublicEnv } from '@/lib/publicEnv';

export function useVeranaChain() {

    const chainName = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_NAME');
    const chainId = getPublicEnv('NEXT_PUBLIC_VERANA_CHAIN_ID');
    const rpc = getPublicEnv('NEXT_PUBLIC_VERANA_RPC_ENDPOINT');
    const rest = getPublicEnv('NEXT_PUBLIC_VERANA_REST_ENDPOINT');
    const explorerUrl = getPublicEnv('NEXT_PUBLIC_VERANA_EXPLORER_URL');

    if (chainName && chainId && rpc && rest) {
        return {
                ...veranaChainEnv,
                chain_name: chainName,
                pretty_name: chainName,
                chain_id: chainId,
                network_type: chainId.includes('devnet') ? 'devnet' : 'testnet',
                apis: {
                rpc: [{ address:  rpc, provider: 'verana' }],
                rest: [{ address:  rest, provider: 'verana' }],
                },
                ...(explorerUrl ? {
                explorers: [{
                    kind: 'Verana Explorer',
                    url: explorerUrl,
                    tx_page: `${explorerUrl}/tx/\${txHash}`,
                }],
                } : {}),
        } as Chain;
    }
    else return veranaChainEnv as Chain;
}
