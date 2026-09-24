import { describe, expect, it } from 'vitest'
import { type TrustCostRates, totalDebitUvna, trustCostLines } from './trust-costs'

const RATES: TrustCostRates = { trustDepositRate: 0.05 }

describe('trustCostLines', () => {
  it('previews the validator fees plus the applicant deposit for an onboarding process', () => {
    const lines = trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: '2000000' }, RATES)
    expect(lines).toEqual([
      { label: 'Validation fees', value: '2 VNA', debitUvna: 2_000_000 },
      { label: 'Trust deposit', value: '0.1 VNA', debitUvna: 100_000 },
    ])
    expect(trustCostLines({ msgType: 'MsgRenewParticipantOP', validationFees: 2_000_000 }, RATES)).toEqual(lines)
    expect(totalDebitUvna(lines)).toBe(2_100_000)
  })

  it('shows nothing for a free onboarding', () => {
    expect(trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: 0 }, RATES)).toEqual([])
    expect(trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: undefined }, RATES)).toEqual([])
  })

  it('keeps the validation fee when the deposit rate could not be read', () => {
    const lines = trustCostLines(
      { msgType: 'MsgStartParticipantOP', validationFees: 5_000_000 },
      { ...RATES, trustDepositRate: null }
    )
    expect(lines.map((line) => line.label)).toEqual(['Validation fees'])
  })

  it('carries the repaid amount as a debit', () => {
    expect(trustCostLines({ msgType: 'MsgRepaySlashedTrustDeposit', amount: 2_000_000 }, RATES)).toEqual([
      { label: 'Repaid deposit', value: '2 VNA', debitUvna: 2_000_000 },
    ])
    expect(trustCostLines({ msgType: 'MsgRepayParticipantSlashedTrustDeposit', amount: '0' }, RATES)).toEqual([])
  })

  it('shows the claimed yield without counting it as a debit', () => {
    const lines = trustCostLines({ msgType: 'MsgReclaimTrustDepositYield', claimable: '150000' }, RATES)
    expect(lines).toEqual([{ label: 'Claimed yield', value: '0.15 VNA' }])
    expect(totalDebitUvna(lines)).toBe(0)
    expect(trustCostLines({ msgType: 'MsgReclaimTrustDepositYield', claimable: null }, RATES)).toEqual([])
  })
})
