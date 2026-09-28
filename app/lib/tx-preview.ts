import type { EncodeObject } from '@cosmjs/proto-signing'
import type { StdFee } from '@cosmjs/stargate'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatVNAFromUVNA } from '@/util/util'

export type TxConfirmMode = 'operator' | 'proposal' | 'account'
export type TxSeverity = 'irreversible' | 'notice'

export interface CostLine {
  label: string
  value: string
  debitUvna?: number
}

export interface ProposalMetadata {
  title: string
  summary: string
}

export function proposalMetadata(title: string, summary: string, fallbackTitle: string): ProposalMetadata {
  const resolved = title.trim() || fallbackTitle
  return { title: resolved, summary: summary.trim() || resolved }
}

export interface TxConfirmRequest {
  titleKey: string
  effect: string
  msgs: EncodeObject[]
  mode: TxConfirmMode
  payer: string
  severity?: TxSeverity
  warning?: string
  costLines?: CostLine[]
  proposalTitle?: string
  corporationLabel?: string
  buildProposalMsgs?: (metadata: ProposalMetadata) => EncodeObject[]
}

export interface TxConfirmResult {
  msgs: EncodeObject[]
}

export function msgShortName(typeUrl: string): string {
  return typeUrl.slice(typeUrl.lastIndexOf('.') + 1)
}

export function txSeverity(typeUrl: string): TxSeverity | null {
  const name = msgShortName(typeUrl)
  if (/^Msg(Revoke|Slash)/.test(name)) return 'irreversible'
  if (typeUrl === '/verana.co.v1.MsgUpdateCorporation' || name.startsWith('MsgArchive')) return 'notice'
  return null
}

function existingText(key: string): string | undefined {
  const text = resolveTranslatable({ key }, translate) ?? key
  return text === key ? undefined : text
}

export function txWarning(typeUrl: string): string | undefined {
  const name = msgShortName(typeUrl)
  return existingText(`txconfirm.warning.${name}`) ?? existingText(`messages.${name}.warning`)
}

export function formatStdFee(fee: StdFee): string {
  const coin = fee.amount[0]
  if (!coin) return '0 VNA'
  return formatVNAFromUVNA(coin.amount) || '0 VNA'
}

export function confirmLabelKey(mode: TxConfirmMode): string {
  return mode === 'proposal' ? 'txconfirm.submitproposal' : 'txconfirm.confirm'
}

export function modeLabelKey(mode: TxConfirmMode): string {
  return `txconfirm.mode.${mode}`
}
