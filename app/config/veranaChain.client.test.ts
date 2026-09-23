import { describe, expect, it, vi } from 'vitest'

vi.mock('next-runtime-env', () => ({ env: () => undefined }))

type UnguardedChain = { apis: { rest: { address: string }[] } }

const readRestTheWayWalletAdaptersDo = (chain: unknown) => (chain as UnguardedChain).apis?.rest[0]?.address

describe('the chain registry entry', () => {
  it('carries no chain REST address', async () => {
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(veranaChainEnv.apis.rest).toEqual([])
  })

  it('keeps an empty rest list so unguarded wallet adapters cannot throw', async () => {
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(() => readRestTheWayWalletAdaptersDo(veranaChainEnv)).not.toThrow()
    expect(readRestTheWayWalletAdaptersDo(veranaChainEnv)).toBeUndefined()
    expect(() => readRestTheWayWalletAdaptersDo({ apis: { rpc: [] } })).toThrow(TypeError)
  })
})
