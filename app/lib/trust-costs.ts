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
      if (fees === null || rates.trustDepositRate === null) return []
      return [debit('validationfees', fees), debit('trustdeposit', Math.round(fees * rates.trustDepositRate))]
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
