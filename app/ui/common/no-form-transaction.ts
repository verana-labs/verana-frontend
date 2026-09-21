import type { StdFee } from '@cosmjs/stargate'

export type BalanceWarningState = {
  availableBalance: number | null
  lowBalance: boolean | null
  balanceLessThanFee: boolean | null
}

function parseNonNegativeAmount(value: string | null): number | null {
  if (value === null) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

export function getBalanceWarningState(
  balance: string | null,
  feeAmount: number | null,
  lowBalanceThreshold: string
): BalanceWarningState {
  const availableBalance = parseNonNegativeAmount(balance)
  if (availableBalance === null) {
    return { availableBalance: null, lowBalance: null, balanceLessThanFee: null }
  }

  const threshold = Number(lowBalanceThreshold)
  const lowBalance = Number.isFinite(threshold) ? availableBalance <= threshold : null
  return {
    availableBalance,
    lowBalance,
    balanceLessThanFee: feeAmount === null ? null : availableBalance <= feeAmount,
  }
}

export function shouldStartNoFormSimulation(
  noForm: boolean,
  availableBalance: number | null,
  simulationStarted: boolean
): boolean {
  return noForm && availableBalance !== null && !simulationStarted
}

export function simulatedFeeUvna(fee: StdFee | undefined): number | null {
  const amount = fee?.amount?.find((coin) => coin.denom === 'uvna')?.amount ?? fee?.amount?.[0]?.amount
  if (amount === undefined) return null
  const parsed = Number(amount)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
