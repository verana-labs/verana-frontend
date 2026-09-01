import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchMetricsResponse, parseDashboardMetricsResponse } from './useDashboardData'

describe('parseDashboardMetricsResponse', () => {
  it('maps the V4 global metrics fields', () => {
    expect(
      parseDashboardMetricsResponse({
        active_ecosystems: 1,
        active_schemas: 2,
        weight: 3,
        issued: 4,
        verified: 5,
      })
    ).toEqual({
      ecosystems: 1,
      schemas: 2,
      totalLockedTrustDeposit: 3,
      issuedCredentials: 4,
      verifiedCredentials: 5,
    })
  })

  it('rejects the V3 active_trust_registries field', () => {
    expect(() =>
      parseDashboardMetricsResponse({
        active_trust_registries: 1,
        active_schemas: 2,
        weight: 3,
        issued: 4,
        verified: 5,
      })
    ).toThrow('active_ecosystems')
  })
})

describe('fetchMetricsResponse', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the direct metrics route when it responds', async () => {
    const direct = { ok: true } as Response
    const fetchMock = vi.fn(async () => direct)
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchMetricsResponse('https://indexer.example/v4/metrics')).resolves.toBe(direct)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://indexer.example/v4/metrics/all')
  })

  it('falls back to the same-origin route when a content blocker kills the request', async () => {
    const proxied = { ok: true } as Response
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(proxied)
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchMetricsResponse('https://indexer.example/v4/metrics')).resolves.toBe(proxied)
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/network-stats')
  })
})
