import { describe, expect, it } from 'vitest'
import { formatVNAFromUVNA } from '@/util/util'
import { parseDashboardMetricsResponse } from './useDashboardData'

const SNAPSHOT = {
  entity_type: 'GLOBAL',
  entity_id: null,
  block_height: 412_893,
  timestamp: '2026-09-09T08:12:44.000Z',
  participants: 31,
  participants_ecosystem: 4,
  participants_issuer_grantor: 2,
  participants_issuer: 11,
  participants_verifier_grantor: 1,
  participants_verifier: 6,
  participants_holder: 7,
  active_ecosystems: 13,
  archived_ecosystems: 2,
  active_schemas: 25,
  archived_schemas: 3,
  weight: 100_000,
  issued: 184,
  verified: 2_671,
  ecosystem_slash_events: 1,
  ecosystem_slashed_amount: 5_000_000,
  ecosystem_slashed_amount_repaid: 2_500_000,
  network_slash_events: 0,
  network_slashed_amount: 0,
  network_slashed_amount_repaid: 0,
}

describe('parseDashboardMetricsResponse', () => {
  it('maps the global snapshot and ignores the fields the dashboard does not show', () => {
    expect(parseDashboardMetricsResponse(SNAPSHOT)).toEqual({
      ecosystems: 13,
      schemas: 25,
      totalLockedTrustDeposit: '100000',
      issuedCredentials: 184,
      verifiedCredentials: 2671,
    })
  })

  it('keeps every digit of a weight above Number.MAX_SAFE_INTEGER', () => {
    const weight = '9007199254740993123'
    const { totalLockedTrustDeposit } = parseDashboardMetricsResponse({ ...SNAPSHOT, weight })

    expect(totalLockedTrustDeposit).toBe(weight)
    expect(formatVNAFromUVNA(String(totalLockedTrustDeposit))).toBe('9,007,199,254,740.993123 VNA')
    expect(String(Number(weight))).not.toBe(weight)
  })

  it('accepts counts sent as digit strings', () => {
    expect(
      parseDashboardMetricsResponse({ ...SNAPSHOT, active_ecosystems: '13', active_schemas: '25', issued: '184' })
    ).toMatchObject({ ecosystems: 13, schemas: 25, issuedCredentials: 184 })
  })

  it('rejects the V3 active_trust_registries field', () => {
    const { active_ecosystems, ...v3 } = SNAPSHOT
    expect(() => parseDashboardMetricsResponse({ ...v3, active_trust_registries: active_ecosystems })).toThrow(
      'active_ecosystems'
    )
  })

  it('rejects values that are neither a finite number nor a digit string', () => {
    const garbage = [null, undefined, true, {}, [], '', '  ', 'ten', '1.5e3', Number.NaN, Number.POSITIVE_INFINITY]
    for (const weight of garbage) {
      expect(() => parseDashboardMetricsResponse({ ...SNAPSHOT, weight })).toThrow('weight')
    }
  })

  it('rejects a payload that is not a JSON object', () => {
    for (const payload of [null, undefined, 'GLOBAL', [SNAPSHOT]]) {
      expect(() => parseDashboardMetricsResponse(payload)).toThrow('Invalid V4 stats snapshot')
    }
  })
})
