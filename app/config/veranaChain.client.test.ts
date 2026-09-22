import { describe, expect, it, vi } from 'vitest'

vi.mock('next-runtime-env', () => ({ env: () => undefined }))

const readRest = (chain: { apis?: { rest?: { address: string }[] } }) => chain.apis?.rest[0]?.address

describe('the chain registry entry', () => {
  it('carries no chain REST address', async () => {
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(veranaChainEnv.apis.rest).toEqual([])
  })

  it('keeps an empty rest list so unguarded wallet adapters cannot throw', async () => {
    const { veranaChainEnv } = await import('./veranaChain.client')
    expect(() => readRest(veranaChainEnv)).not.toThrow()
    expect(readRest(veranaChainEnv)).toBeUndefined()
    expect(() => readRest({ apis: { rpc: [] } as never })).toThrow(TypeError)
  })
})
