/** biome-ignore-all lint/style/noNonNullAssertion: NEXT_PUBLIC_* vars are inlined by Next at build time and validated by entrypoint.sh at container start */
'use client'

import '@/styles/global.css'
import { ChainProvider } from '@cosmos-kit/react'
import '@interchain-ui/react/styles'
import { wallets } from 'cosmos-kit'
import { env } from 'next-runtime-env'
import { veranaAssets } from '@/config/veranaChain.client'
import { useVeranaChain } from '@/hooks/useVeranaChain'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain()
  const customChains = [veranaChain]
  const assetLists = [{ chain_name: veranaChain.chain_name, assets: [veranaAssets] }]
  const duration =
    Number(env('NEXT_PUBLIC_SESSION_LIFETIME_SECONDS') || process.env.NEXT_PUBLIC_SESSION_LIFETIME_SECONDS) * 1000
  const projectId = process.env.NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_PROJECT_ID!
  const relayUrl = process.env.NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_RELAY_URL!
  const name = process.env.NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_NAME!
  const description = process.env.NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_DESCRIPTION!
  const url = process.env.NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_URL!
  const icons = [process.env.NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_ICONS!]

  return (
    <ChainProvider
      sessionOptions={{ duration }}
      throwErrors={true}
      chains={customChains}
      assetLists={assetLists}
      wallets={wallets}
      walletConnectOptions={{
        signClient: {
          projectId,
          relayUrl,
          metadata: {
            name,
            description,
            url,
            icons,
          },
        },
      }}
    >
      {children}
    </ChainProvider>
  )
}
