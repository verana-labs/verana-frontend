import type { NextConfig } from 'next'
import { version } from './package.json'

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // /api/language-options reads these CLDR files with dynamic paths at request
  // time, which output file tracing cannot discover — without this the files
  // are missing from the standalone (Docker) output and the route 500s.
  outputFileTracingIncludes: {
    '/api/language-options': [
      'node_modules/cldr-localenames-full/package.json',
      'node_modules/cldr-localenames-full/main/*/languages.json',
      'node_modules/cldr-localenames-full/main/en/territories.json',
      'node_modules/cldr-localenames-full/main/en/scripts.json',
    ],
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
