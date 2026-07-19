import type { NextConfig } from 'next'
import { version } from './package.json'

const nextConfig: NextConfig = {
  output: 'standalone',
  redirects: async () => [
    { source: '/tr', destination: '/ecosystems', permanent: false },
    { source: '/tr/cs/:id', destination: '/credential-schemas/:id', permanent: false },
    { source: '/tr/:id', destination: '/ecosystems/:id', permanent: false },
  ],
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  turbopack: {
    resolveAlias: {
      '@codec-proto': '@verana-labs/verana-types/codec', // @verana-labs/verana-types
      '@amino-converter': '@verana-labs/verana-types/amino-converter', // @verana-labs/verana-types
      // '@codec-proto': 'proto-codecs/codec', // local
      // '@amino-converter': 'app/msg/amino-converter' // local
    },
  },
}

export default nextConfig
