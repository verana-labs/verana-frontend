import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const KEPLR_EXTENSION_ID = 'dmkamcknogkgcdfhhbddcghachkejeap'
export const DEVNET_CHAIN_ID = 'vna-devnet-1'
const TESTNET_CHAIN_ID = /^vna-testnet-\d+$/

export type LiveEnv = {
  chainId: string
  chainName: string
  rpc: string
  rest: string
  indexer: string
  baseUrl: string
  extensionPath: string
  profileDir: string
  minUvna: bigint
}

export function loadDotEnv(): void {
  if (existsSync('.env')) process.loadEnvFile('.env')
}

function required(name: string, hint: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not set. ${hint}`)
  return value
}

export function assertLiveChain(source: NodeJS.ProcessEnv = process.env): string {
  const chainId = source.NEXT_PUBLIC_VERANA_CHAIN_ID?.trim() ?? ''
  const allowTestnet = source.E2E_LIVE_ALLOW_TESTNET === 'true'
  if (/main/i.test(chainId)) {
    throw new Error(`Refusing to run the live Keplr suite against "${chainId}": it looks like mainnet.`)
  }
  const allowed = chainId === DEVNET_CHAIN_ID || (allowTestnet && TESTNET_CHAIN_ID.test(chainId))
  if (!allowed) {
    throw new Error(
      `Refusing to run the live Keplr suite: NEXT_PUBLIC_VERANA_CHAIN_ID is "${chainId || 'unset'}", expected "${DEVNET_CHAIN_ID}"` +
        ' (a vna-testnet-N chain is only accepted with E2E_LIVE_ALLOW_TESTNET=true).'
    )
  }
  const word = chainId === DEVNET_CHAIN_ID ? 'devnet' : 'testnet'
  for (const name of ['NEXT_PUBLIC_VERANA_RPC_ENDPOINT', 'NEXT_PUBLIC_VERANA_REST_ENDPOINT']) {
    const url = source[name]?.trim() ?? ''
    if (/main/i.test(url) || !url.includes(word)) {
      throw new Error(`Refusing to run: ${name}="${url}" is not a ${word} endpoint.`)
    }
  }
  return chainId
}

export function readLiveEnv(): LiveEnv {
  const chainId = assertLiveChain()
  const extensionPath = required('E2E_KEPLR_EXTENSION_PATH', 'Point it at the unpacked Keplr extension folder.')
  if (!existsSync(join(extensionPath, 'manifest.json'))) {
    throw new Error(
      `E2E_KEPLR_EXTENSION_PATH="${extensionPath}" has no manifest.json, it is not an unpacked extension.`
    )
  }
  const profileDir = required('E2E_KEPLR_PROFILE', 'Point it at the Chromium profile folder created by the setup run.')
  const port = process.env.E2E_LIVE_PORT ?? '3200'
  return {
    chainId,
    chainName: process.env.NEXT_PUBLIC_VERANA_CHAIN_NAME ?? chainId,
    rpc: required('NEXT_PUBLIC_VERANA_RPC_ENDPOINT', 'It is read from .env.'),
    rest: required('NEXT_PUBLIC_VERANA_REST_ENDPOINT', 'It is read from .env.').replace(/\/$/, ''),
    indexer: required('NEXT_PUBLIC_VERANA_INDEXER_BASE_URL', 'It is read from .env.').replace(/\/$/, ''),
    baseUrl: process.env.E2E_LIVE_BASE_URL ?? `http://localhost:${port}`,
    extensionPath,
    profileDir,
    minUvna: BigInt(process.env.E2E_LIVE_MIN_UVNA ?? '300000000'),
  }
}
