import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_ECOSYSTEM: 'https://indexer.example/v4/ecosystem',
  VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA: 'https://indexer.example/v4/credential-schema',
}))

import { logger } from '@/lib/logger'
import { fetchEntityHistory, historyUrl } from './useEntityHistory'

describe('historyUrl', () => {
  it('targets the entity history route with the page limit', () => {
    expect(historyUrl('ecosystem', '13')).toBe('https://indexer.example/v4/ecosystem/history/13?limit=64')
    expect(historyUrl('credential-schema', '26')).toBe(
      'https://indexer.example/v4/credential-schema/history/26?limit=64'
    )
  })
})

describe('fetchEntityHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads the live activity timeline newest first with the changed fields', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        entity_type: 'CredentialSchema',
        entity_id: '26',
        activity: [
          {
            id: 364,
            timestamp: '2026-08-26T11:35:48.025Z',
            block_height: 310086,
            entity_type: 'CredentialSchema',
            entity_id: '26',
            msg: 'CreateCredentialSchema',
            changes: { title: 'Keplr Fee Credential', issuer_onboarding_mode: 'ECOSYSTEM_ONBOARDING_PROCESS' },
            account: 'verana1h5m6c6a33kncyrm05rz4k4lj9u2q2t2dkzrnts',
          },
          {
            id: 379,
            timestamp: '2026-08-27T21:40:25.846Z',
            block_height: 333232,
            entity_type: 'CredentialSchema',
            entity_id: '26',
            msg: 'StatsUpdate',
            changes: { stats_update: true },
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const rows = await fetchEntityHistory('credential-schema', '26')

    expect(fetchMock).toHaveBeenCalledWith('https://indexer.example/v4/credential-schema/history/26?limit=64')
    expect(rows.map((row) => row.msg)).toEqual(['StatsUpdate', 'CreateCredentialSchema'])
    expect(rows[1]).toMatchObject({
      id: 364,
      blockHeight: 310086,
      account: 'verana1h5m6c6a33kncyrm05rz4k4lj9u2q2t2dkzrnts',
      changes: { title: 'Keplr Fee Credential' },
    })
  })

  it('degrades a failed request to an empty timeline and logs it', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    )
    await expect(fetchEntityHistory('ecosystem', '13')).resolves.toEqual([])
    expect(error).toHaveBeenCalledOnce()
  })
})
