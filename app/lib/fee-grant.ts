import type { StdFee } from '@cosmjs/stargate'
import { veranaDenom } from '@/config/veranaChain.sign.client'

export interface DenomAmount {
  denom: string
  amount: string
}

export interface FeeGrant {
  msgTypes: string[]
  spendLimit: DenomAmount[] | null
  remainingSpend: DenomAmount[] | null
  expiration: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asDenomAmounts(value: unknown): DenomAmount[] | null {
  if (!Array.isArray(value)) return null
  const coins: DenomAmount[] = []
  for (const entry of value) {
    const coin = asRecord(entry)
    if (!coin || typeof coin.denom !== 'string' || typeof coin.amount !== 'string') continue
    coins.push({ denom: coin.denom, amount: coin.amount })
  }
  return coins.length > 0 ? coins : null
}

function asAmount(value: string): bigint | null {
  return /^\d+$/.test(value) ? BigInt(value) : null
}

export function parseFeeGrants(payload: unknown): FeeGrant[] {
  const envelope = asRecord(payload)
  if (!envelope || !Array.isArray(envelope.fee_grants)) return []
  const grants: FeeGrant[] = []
  for (const entry of envelope.fee_grants) {
    const grant = asRecord(entry)
    if (!grant) continue
    grants.push({
      msgTypes: Array.isArray(grant.msg_types)
        ? grant.msg_types.filter((msgType): msgType is string => typeof msgType === 'string')
        : [],
      spendLimit: asDenomAmounts(grant.spend_limit),
      remainingSpend: asDenomAmounts(grant.remaining_spend),
      expiration: typeof grant.expiration === 'string' ? grant.expiration : null,
    })
  }
  return grants
}

export function nativeFeeAmount(fee: StdFee): string {
  return fee.amount.find((coin) => coin.denom === veranaDenom)?.amount ?? '0'
}

function isExpired(expiration: string | null, now: number): boolean {
  if (!expiration) return false
  const deadline = Date.parse(expiration)
  return Number.isFinite(deadline) && deadline <= now
}

function coversMsgType(grant: FeeGrant, msgType: string): boolean {
  return grant.msgTypes.length === 0 || grant.msgTypes.includes(msgType)
}

function coversFee(grant: FeeGrant, fee: bigint | null): boolean {
  if (!grant.spendLimit) return true
  if (fee === null) return false
  const remaining = grant.remainingSpend?.find((coin) => coin.denom === veranaDenom)
  const available = remaining ? asAmount(remaining.amount) : null
  return available !== null && available >= fee
}

export function feeGrantCovering(
  grants: FeeGrant[],
  msgType: string,
  feeAmountUvna: string,
  now = Date.now()
): FeeGrant | null {
  const fee = asAmount(feeAmountUvna)
  return (
    grants.find(
      (grant) => coversMsgType(grant, msgType) && !isExpired(grant.expiration, now) && coversFee(grant, fee)
    ) ?? null
  )
}
