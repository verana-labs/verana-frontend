import type { EncodeObject } from '@cosmjs/proto-signing'
import type { StdFee } from '@cosmjs/stargate'
import { formatVNAFromUVNA } from '@/util/util'

export type TxConfirmMode = 'operator' | 'proposal' | 'account'
export type TxSeverity = 'irreversible' | 'notice'

export interface ProposalMetadata {
  title: string
  summary: string
}

export function proposalMetadata(title: string, summary: string, fallbackTitle: string): ProposalMetadata {
  const resolved = title.trim() || fallbackTitle
  return { title: resolved, summary: summary.trim() || resolved }
}

export interface TxFeeGrant {
  corporationId: number
  grantee: string
  msgType: string
  granterAddress: string
}

export interface TxConfirmRequest {
  titleKey: string
  effect: string
  msgs: EncodeObject[]
  mode: TxConfirmMode
  payer: string
  severity?: TxSeverity
  warning?: string
  costLines?: { label: string; value: string }[]
  proposalTitle?: string
  corporationLabel?: string
  buildProposalMsgs?: (metadata: ProposalMetadata) => EncodeObject[]
  feeGrant?: TxFeeGrant
}

export interface TxConfirmResult {
  msgs: EncodeObject[]
  granter?: string
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
