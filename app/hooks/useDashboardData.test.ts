import { describe, expect, it } from 'vitest'
import { parseDashboardMetricsResponse } from './useDashboardData'

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
