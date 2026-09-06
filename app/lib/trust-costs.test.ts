import { describe, expect, it } from 'vitest'
import { balanceWarning, type TrustCostRates, totalDebitUvna, trustCostLines } from './trust-costs'

const RATES: TrustCostRates = {
  trustDepositRate: 0.05,
  trustUnitPrice: 1_000_000,
  ecosystemTrustDeposit: 10,
  credentialSchemaTrustDeposit: 10,
}

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

  it('shows nothing for a free onboarding or without the rate', () => {
    expect(trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: 0 }, RATES)).toEqual([])
    expect(trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: undefined }, RATES)).toEqual([])
    expect(
      trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: 5 }, { ...RATES, trustDepositRate: null })
    ).toEqual([])
  })

  it('prices the module deposits in trust units', () => {
    expect(trustCostLines({ msgType: 'MsgCreateEcosystem' }, RATES)).toEqual([
      { label: 'Trust deposit', value: '10 VNA', debitUvna: 10_000_000 },
    ])
    expect(
      trustCostLines({ msgType: 'MsgCreateCredentialSchema' }, { ...RATES, credentialSchemaTrustDeposit: 3 })
    ).toEqual([{ label: 'Trust deposit', value: '3 VNA', debitUvna: 3_000_000 }])
  })

  it('hides a module deposit the indexer does not expose', () => {
    expect(trustCostLines({ msgType: 'MsgCreateEcosystem' }, { ...RATES, ecosystemTrustDeposit: null })).toEqual([])
    expect(trustCostLines({ msgType: 'MsgCreateCredentialSchema' }, { ...RATES, trustUnitPrice: null })).toEqual([])
    expect(trustCostLines({ msgType: 'MsgCreateEcosystem' }, { ...RATES, ecosystemTrustDeposit: 0 })).toEqual([])
  })

  it('carries the repaid amount as a debit', () => {
    expect(trustCostLines({ msgType: 'MsgRepaySlashedTrustDeposit', amount: 2_000_000 }, RATES)).toEqual([
      { label: 'Repaid deposit', value: '2 VNA', debitUvna: 2_000_000 },
    ])
    expect(trustCostLines({ msgType: 'MsgRepayParticipantSlashedTrustDeposit', amount: '0' }, RATES)).toEqual([])
  })

  it('warns when the fee plus the trust costs exceed the balance and only flags a low balance otherwise', () => {
    const lines = trustCostLines({ msgType: 'MsgStartParticipantOP', validationFees: 2_000_000 }, RATES)
    expect(balanceWarning('2000000', 90_000, lines, '1000000')).toBe('shortfall')
    expect(balanceWarning('2200000', 90_000, lines, '1000000')).toBeNull()
    expect(balanceWarning('900000', 90_000, [], '1000000')).toBe('low')
    expect(balanceWarning('900000', 90_000, undefined, '1000000')).toBe('low')
    expect(balanceWarning('2000000', null, lines, '1000000')).toBeNull()
    expect(balanceWarning(null, 90_000, lines, '1000000')).toBeNull()
  })

  it('shows the claimed yield without counting it as a debit', () => {
    const lines = trustCostLines({ msgType: 'MsgReclaimTrustDepositYield', claimable: '150000' }, RATES)
    expect(lines).toEqual([{ label: 'Claimed yield', value: '0.15 VNA' }])
    expect(totalDebitUvna(lines)).toBe(0)
    expect(trustCostLines({ msgType: 'MsgReclaimTrustDepositYield', claimable: null }, RATES)).toEqual([])
  })
})
