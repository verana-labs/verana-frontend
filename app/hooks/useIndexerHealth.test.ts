import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_INDEXER: 'https://indexer.example/v4/indexer',
}))

import { logger } from '@/lib/logger'
import { fetchIndexerHealth, parseIndexerStatus } from './useIndexerHealth'

const STALLED = {
  is_running: true,
  is_crawling: false,
  stopped_at: '2026-09-07T08:37:10.982Z',
  stopped_reason: 'Crawling stopped due to: Blockchain API unhealthy (3 failures)',
  last_error: { message: 'Blockchain API unhealthy', service: 'BLOCKCHAIN_HEALTH' },
}

describe('parseIndexerStatus', () => {
  it('reads the live stalled status', () => {
    expect(parseIndexerStatus(STALLED)).toEqual({
      running: true,
      crawling: false,
      stoppedAt: '2026-09-07T08:37:10.982Z',
      stoppedReason: 'Crawling stopped due to: Blockchain API unhealthy (3 failures)',
    })
  })

  it('tolerates a healthy status without stop details', () => {
    expect(parseIndexerStatus({ is_running: true, is_crawling: true })).toEqual({
      running: true,
      crawling: true,
      stoppedAt: null,
      stoppedReason: null,
    })
  })

  it('rejects a payload without the crawling flag', () => {
    expect(() => parseIndexerStatus({ is_running: true })).toThrow('status.is_crawling')
  })
})

describe('fetchIndexerHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads the status without fetching the block height', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => STALLED }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchIndexerHealth()).resolves.toEqual({
      running: true,
      crawling: false,
      stoppedAt: '2026-09-07T08:37:10.982Z',
      stoppedReason: 'Crawling stopped due to: Blockchain API unhealthy (3 failures)',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('https://indexer.example/v4/indexer/status')
  })

  it('degrades a failed status response to null and logs it', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }))
    )
    await expect(fetchIndexerHealth()).resolves.toBeNull()
    expect(error).toHaveBeenCalledOnce()
  })

  it('degrades an unreachable indexer to null and logs it', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )
    await expect(fetchIndexerHealth()).resolves.toBeNull()
    expect(error).toHaveBeenCalledOnce()
  })
})
