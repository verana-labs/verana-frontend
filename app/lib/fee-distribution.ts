import type { Participant } from '@/ui/dataview/datasections/participant'

export type FeeDistributionKind = 'issuance' | 'verification'

export type FeeBeneficiary = Pick<Participant, 'id' | 'role' | 'did'> & { amountUvna: number }

export type FeeDistribution = {
  kind: FeeDistributionKind
  beneficiaries: FeeBeneficiary[]
  totalUvna: number
  depositUvna: number | null
}

type Payer = Pick<Participant, 'role' | 'issuance_fee_discount' | 'verification_fee_discount'>
type Beneficiary = Pick<Participant, 'id' | 'role' | 'did' | 'issuance_fees' | 'verification_fees'>

function amount(value: string | number | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function discountFraction(value: string | number | undefined): number {
  const parsed = Number(value ?? 0)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.min(parsed <= 1 ? parsed : parsed / 10_000, 1)
}

export function feeDistributionKind(role: Participant['role']): FeeDistributionKind | null {
  if (role === 'ISSUER') return 'issuance'
  if (role === 'VERIFIER') return 'verification'
  return null
}

export function feeDistribution(
  payer: Payer,
  beneficiaries: Beneficiary[],
  trustDepositRate: number | null
): FeeDistribution | null {
  const kind = feeDistributionKind(payer.role)
  if (!kind) return null
  const discount = discountFraction(kind === 'issuance' ? payer.issuance_fee_discount : payer.verification_fee_discount)
  const rows = beneficiaries.map((beneficiary) => ({
    id: beneficiary.id,
    role: beneficiary.role,
    did: beneficiary.did,
    amountUvna: Math.round(
      amount(kind === 'issuance' ? beneficiary.issuance_fees : beneficiary.verification_fees) * (1 - discount)
    ),
  }))
  const totalUvna = rows.reduce((sum, row) => sum + row.amountUvna, 0)
  return {
    kind,
    beneficiaries: rows,
    totalUvna,
    depositUvna: trustDepositRate === null ? null : Math.round(totalUvna * trustDepositRate),
  }
}
