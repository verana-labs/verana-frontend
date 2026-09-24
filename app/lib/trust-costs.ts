import { translate } from '@/i18n/dataview'
import type { ProtocolParams } from '@/lib/protocolParams'
import type { CostLine } from '@/lib/tx-preview'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatVNAFromUVNA } from '@/util/util'

export type TrustCostRates = Pick<ProtocolParams, 'trustDepositRate'>

export type TrustCostSubject =
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

export function trustCostLines(subject: TrustCostSubject, rates: TrustCostRates): CostLine[] {
  switch (subject.msgType) {
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
