import { translate } from '@/i18n/dataview'
import type { ProtocolParams } from '@/lib/protocolParams'
import type { CostLine } from '@/lib/tx-preview'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatVNAFromUVNA } from '@/util/util'

export type TrustCostRates = Pick<
  ProtocolParams,
  'trustDepositRate' | 'trustUnitPrice' | 'ecosystemTrustDeposit' | 'credentialSchemaTrustDeposit'
>

export type TrustCostSubject =
  | { msgType: 'MsgCreateEcosystem' | 'MsgCreateCredentialSchema' }
  | { msgType: 'MsgStartParticipantOP' | 'MsgRenewParticipantOP'; validationFees: string | number | undefined }
  | {
      msgType: 'MsgRepaySlashedTrustDeposit' | 'MsgRepayParticipantSlashedTrustDeposit'
      amount: string | number | undefined
    }
  | { msgType: 'MsgReclaimTrustDepositYield'; claimable: string | number | null | undefined }

function label(key: string): string {
  return resolveTranslatable({ key: `txconfirm.cost.${key}` }, translate) ?? key
}

function uvna(value: string | number | null | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function debit(key: string, amount: number): CostLine {
  return { label: label(key), value: formatVNAFromUVNA(String(amount)), debitUvna: amount }
}

function moduleDeposit(units: number | null, unitPrice: number | null): CostLine[] {
  if (units === null || unitPrice === null) return []
  const amount = Math.round(units * unitPrice)
  return amount > 0 ? [debit('trustdeposit', amount)] : []
}

export function trustCostLines(subject: TrustCostSubject, rates: TrustCostRates): CostLine[] {
  switch (subject.msgType) {
    case 'MsgCreateEcosystem':
      return moduleDeposit(rates.ecosystemTrustDeposit, rates.trustUnitPrice)
    case 'MsgCreateCredentialSchema':
      return moduleDeposit(rates.credentialSchemaTrustDeposit, rates.trustUnitPrice)
    case 'MsgStartParticipantOP':
    case 'MsgRenewParticipantOP': {
      const fees = uvna(subject.validationFees)
      if (fees === null) return []
      const rate = rates.trustDepositRate
      if (rate === null) return [debit('validationfees', fees)]
      return [debit('validationfees', fees), debit('trustdeposit', Math.round(fees * rate))]
    }
    case 'MsgRepaySlashedTrustDeposit':
    case 'MsgRepayParticipantSlashedTrustDeposit': {
      const amount = uvna(subject.amount)
      return amount === null ? [] : [debit('repay', amount)]
    }
    case 'MsgReclaimTrustDepositYield': {
      const amount = uvna(subject.claimable)
      return amount === null ? [] : [{ label: label('yield'), value: formatVNAFromUVNA(String(amount)) }]
    }
  }
}

export function totalDebitUvna(lines: CostLine[]): number {
  return lines.reduce((sum, line) => sum + (line.debitUvna ?? 0), 0)
}

export interface BalanceWarning {
  kind: 'shortfall' | 'low'
  requiredUvna: number
}

function parseNonNegativeAmount(value: string | null): number | null {
  if (value === null) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

export function balanceWarning(
  balance: string | null,
  feeUvna: number | null,
  costLines: CostLine[] | undefined,
  lowBalanceThreshold: string,
  feeGranted: boolean
): BalanceWarning | null {
  const debitUvna = totalDebitUvna(costLines ?? [])
  if (feeGranted && debitUvna === 0) return null
  const requiredUvna = feeGranted ? debitUvna : feeUvna === null ? null : feeUvna + debitUvna
  const available = parseNonNegativeAmount(balance)
  if (requiredUvna === null || available === null) return null
  if (available < requiredUvna) return { kind: 'shortfall', requiredUvna }
  const threshold = Number(lowBalanceThreshold)
  if (!feeGranted && Number.isFinite(threshold) && available < threshold) return { kind: 'low', requiredUvna }
  return null
}
