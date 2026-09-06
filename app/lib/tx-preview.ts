import type { EncodeObject } from '@cosmjs/proto-signing'
import type { StdFee } from '@cosmjs/stargate'
import { formatVNAFromUVNA } from '@/util/util'

export type TxConfirmMode = 'operator' | 'proposal' | 'account'
export type TxSeverity = 'irreversible' | 'notice'

export interface CostLine {
  label: string
  value: string
  debitUvna?: number
}

export interface ProposalMeta {
  title: string
  summary: string
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
  composer?: boolean
  proposalTitle?: string
  rebuild?: (meta: ProposalMeta) => EncodeObject[]
  corporationLabel?: string
}

export interface TxConfirmResult {
  msgs: EncodeObject[]
}

export function proposalMeta(draft: Partial<ProposalMeta>, fallbackTitle: string): ProposalMeta {
  const title = draft.title?.trim() || fallbackTitle
  return { title, summary: draft.summary?.trim() || title }
}

export function composerMsgs(
  request: Pick<TxConfirmRequest, 'msgs' | 'proposalTitle' | 'rebuild'>,
  draft: Partial<ProposalMeta>
): EncodeObject[] {
  if (!request.rebuild) return request.msgs
  return request.rebuild(proposalMeta(draft, request.proposalTitle ?? ''))
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
