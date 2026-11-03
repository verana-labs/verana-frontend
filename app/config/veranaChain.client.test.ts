import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-runtime-env', () => ({ env: () => undefined }))

type UnguardedChain = { apis: { rest: { address: string }[] } }

const readRestTheWayWalletAdaptersDo = (chain: unknown) => (chain as UnguardedChain).apis?.rest[0]?.address

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('the chain registry entry', () => {
  it('carries no chain REST address when none is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERANA_REST_ENDPOINT', '')
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(veranaChainEnv.apis.rest).toEqual([])
  })

  it('keeps an empty rest list so unguarded wallet adapters cannot throw', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERANA_REST_ENDPOINT', '')
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(() => readRestTheWayWalletAdaptersDo(veranaChainEnv)).not.toThrow()
    expect(readRestTheWayWalletAdaptersDo(veranaChainEnv)).toBeUndefined()
    expect(() => readRestTheWayWalletAdaptersDo({ apis: { rpc: [] } })).toThrow(TypeError)
  })

  it('hands the configured REST endpoint to wallets, without a trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERANA_REST_ENDPOINT', 'https://api.testnet.verana.network/')
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(veranaChainEnv.apis.rest).toEqual([{ address: 'https://api.testnet.verana.network', provider: 'verana' }])
    expect(readRestTheWayWalletAdaptersDo(veranaChainEnv)).toBe('https://api.testnet.verana.network')
  })
})

describe('veranaRestApis', () => {
  it('returns an empty list for an unset or empty address', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERANA_REST_ENDPOINT', '')
    const { veranaRestApis } = await import('./veranaChain.client')
    expect(veranaRestApis(undefined)).toEqual([])
    expect(veranaRestApis('')).toEqual([])
  })
})
