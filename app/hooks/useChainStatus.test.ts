import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useVeranaChain', () => ({ useVeranaChain: () => ({}) }))

import { logger } from '@/lib/logger'
import { fetchChainStatus, parseChainStatus } from './useChainStatus'

const STATUS = {
  jsonrpc: '2.0',
  id: -1,
  result: {
    node_info: { protocol_version: { p2p: '8', block: '11', app: '0' }, network: 'vna-devnet-1', version: '0.38.17' },
    sync_info: {
      latest_block_hash: 'AB',
      latest_block_height: '502253',
      latest_block_time: '2026-09-07T08:36:01.190753731Z',
      catching_up: false,
    },
    validator_info: { address: 'AB', voting_power: '0' },
  },
}

describe('parseChainStatus', () => {
  it('reads the CometBFT status envelope', () => {
    expect(parseChainStatus(STATUS)).toEqual({
      network: 'vna-devnet-1',
      nodeVersion: '0.38.17',
      latestBlockHeight: 502253,
      latestBlockTime: '2026-09-07T08:36:01.190753731Z',
      catchingUp: false,
    })
  })

  it('rejects a non-numeric height', () => {
    const broken = structuredClone(STATUS)
    broken.result.sync_info.latest_block_height = 'soon'
    expect(() => parseChainStatus(broken)).toThrow('latest_block_height')
  })
})

describe('fetchChainStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('queries the RPC status route without a trailing slash', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => STATUS }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchChainStatus('https://rpc.example/')).resolves.toMatchObject({ latestBlockHeight: 502253 })
    expect(fetchMock).toHaveBeenCalledWith('https://rpc.example/status')
  })

  it('degrades an unreachable node to null and logs it', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }))
    )
    await expect(fetchChainStatus('https://rpc.example')).resolves.toBeNull()
    expect(error).toHaveBeenCalledOnce()
  })
})
