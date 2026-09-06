import { describe, expect, it } from 'vitest'
import { feeDistribution, feeDistributionKind } from './fee-distribution'

const ecosystem = {
  id: '1',
  role: 'ECOSYSTEM' as const,
  did: 'did:web:eco.example',
  issuance_fees: 300000,
  verification_fees: 100000,
}
const grantor = { id: '7', role: 'ISSUER_GRANTOR' as const, did: null, issuance_fees: '200000', verification_fees: 0 }

describe('feeDistributionKind', () => {
  it('maps issuers to issuance and verifiers to verification', () => {
    expect(feeDistributionKind('ISSUER')).toBe('issuance')
    expect(feeDistributionKind('VERIFIER')).toBe('verification')
    expect(feeDistributionKind('ECOSYSTEM')).toBeNull()
    expect(feeDistributionKind('HOLDER')).toBeNull()
  })
})

describe('feeDistribution', () => {
  it('sums the issuance fees of every ancestor and derives the payer deposit', () => {
    expect(feeDistribution({ role: 'ISSUER' }, [ecosystem, grantor], 0.05)).toEqual({
      kind: 'issuance',
      beneficiaries: [
        { id: '1', role: 'ECOSYSTEM', did: 'did:web:eco.example', amountUvna: 300000 },
        { id: '7', role: 'ISSUER_GRANTOR', did: null, amountUvna: 200000 },
      ],
      totalUvna: 500000,
      depositUvna: 25000,
    })
  })

  it('uses the verification fees for a verifier and leaves the deposit unknown without the rate', () => {
    expect(feeDistribution({ role: 'VERIFIER' }, [ecosystem, grantor], null)).toEqual({
      kind: 'verification',
      beneficiaries: [
        { id: '1', role: 'ECOSYSTEM', did: 'did:web:eco.example', amountUvna: 100000 },
        { id: '7', role: 'ISSUER_GRANTOR', did: null, amountUvna: 0 },
      ],
      totalUvna: 100000,
      depositUvna: null,
    })
  })

  it('applies the payer discount as a fraction or as basis points', () => {
    expect(feeDistribution({ role: 'ISSUER', issuance_fee_discount: 0.5 }, [ecosystem], 0.05)?.totalUvna).toBe(150000)
    expect(feeDistribution({ role: 'ISSUER', issuance_fee_discount: 2500 }, [ecosystem], 0.05)?.totalUvna).toBe(225000)
    expect(feeDistribution({ role: 'VERIFIER', verification_fee_discount: 10000 }, [ecosystem], 0.05)?.totalUvna).toBe(
      0
    )
  })

  it('has nothing to preview for roles that pay no per-credential fees', () => {
    expect(feeDistribution({ role: 'ISSUER_GRANTOR' }, [ecosystem], 0.05)).toBeNull()
  })
})
