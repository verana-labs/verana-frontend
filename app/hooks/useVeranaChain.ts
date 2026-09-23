'use client'

import { Chain } from '@chain-registry/types'
import { VERANA_CHAIN_ID, VERANA_CHAIN_NAME, VERANA_EXPLORER_URL, VERANA_RPC_ENDPOINT } from '@/config/env'
import { veranaChainEnv } from '@/config/veranaChain.client'

// Return the explorer URL of one transaction from the tx_page template. Return undefined without an explorer.
export function explorerTxUrl(txHash: string): string | undefined {
  const template = veranaChainEnv.explorers?.[0]?.tx_page
  return VERANA_EXPLORER_URL && template ? template.replace(/\$\{txHash\}/, txHash) : undefined
}

export function useVeranaChain() {
  const chainName = VERANA_CHAIN_NAME
  const chainId = VERANA_CHAIN_ID
  const rpc = VERANA_RPC_ENDPOINT
  const explorerUrl = VERANA_EXPLORER_URL

  if (chainName && chainId && rpc) {
    return {
      ...veranaChainEnv,
      chain_name: chainName,
      pretty_name: chainName,
      chain_id: chainId,
      network_type: chainId.includes('devnet') ? 'devnet' : 'testnet',
      apis: {
        rpc: [{ address: rpc, provider: 'verana' }],
        rest: [],
      },
      ...(explorerUrl
        ? {
            explorers: [
              {
                kind: 'Verana Explorer',
                url: explorerUrl,
                tx_page: `${explorerUrl}/tx/\${txHash}`,
              },
            ],
          }
        : {}),
    } as Chain
  } else return veranaChainEnv as Chain
}
