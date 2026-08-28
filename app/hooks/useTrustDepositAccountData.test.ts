import { describe, expect, it } from 'vitest'
import { parseTrustDepositResponse, trustDepositAccountUrl } from '@/hooks/useTrustDepositAccountData'

describe('trust deposit account parsing', () => {
  it('reads the strict V4 envelope', () => {
    expect(
      parseTrustDepositResponse({
        trust_deposit: {
          corporation_id: 12,
          deposit: 150,
          share: 100,
          claimable: 12,
          slashed_deposit: 5,
          repaid_deposit: 2,
          last_slashed: null,
          last_repaid: null,
          slash_count: 1,
        },
      })
    ).toEqual({ totalTrustDeposit: '150', claimableInterests: '12', reclaimable: '12', slashCount: 1 })
  })

  it('accepts the scaled V4 share returned for a funded corporation', () => {
    expect(
      parseTrustDepositResponse({
        trust_deposit: {
          corporation_id: 12,
          deposit: 2,
          share: 2_000_000_000_000_000_000,
          claimable: 0,
          slashed_deposit: 0,
          repaid_deposit: 0,
          last_slashed: null,
          last_repaid: null,
          slash_count: 0,
        },
      })
    ).toEqual({ totalTrustDeposit: '2', claimableInterests: '0', reclaimable: '0', slashCount: 0 })
  })

  it('rejects V3 field aliases', () => {
    expect(() => parseTrustDepositResponse({ trust_deposit: { amount: 150, claimable: 12, slash_count: 1 } })).toThrow(
      'trust_deposit.corporation_id'
    )
  })

  it('queries by corporation id', () => {
    expect(trustDepositAccountUrl('https://indexer/v4/trust-deposit', 1)).toBe('https://indexer/v4/trust-deposit/get/1')
  })
})
