import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { Translatable } from '@/ui/dataview/types'

export type MessageType =
  | 'MsgStoreDigest' // DI
  | 'MsgReclaimTrustDepositYield'
  | 'MsgRepaySlashedTrustDeposit' // TD
  | 'MsgCreateEcosystem'
  | 'MsgUpdateEcosystem'
  | 'MsgArchiveEcosystem'
  | 'MsgUnarchiveEcosystem' // EC
  | 'MsgAddGovernanceFrameworkDocument'
  | 'MsgIncreaseActiveGovernanceFrameworkVersion' // GF
  | 'MsgCreateCredentialSchema'
  | 'MsgUpdateCredentialSchema'
  | 'MsgArchiveCredentialSchema'
  | 'MsgUnarchiveCredentialSchema' // CS
  | 'MsgCancelParticipantOPLastRequest'
  | 'MsgRenewParticipantOP'
  | 'MsgSetParticipantOPToValidated'
  | 'MsgStartParticipantOP' // PP OP
  | 'MsgSetParticipantEffectiveUntil'
  | 'MsgRevokeParticipant'
  | 'MsgCreateOrUpdateParticipantSession'
  | 'MsgSlashParticipantTrustDeposit'
  | 'MsgRepayParticipantSlashedTrustDeposit'
  | 'MsgCreateRootParticipant'
  | 'MsgSelfCreateParticipant' // PP
  | 'MsgCreateCorporation'
  | 'MsgGrantSelfOperatorAuthorization' // CO/DE bootstrap

export interface MsgTypeInfoI18n {
  label: Translatable
  description: Translatable
  cost: Translatable
  warning?: Translatable
}

export interface MsgTypeStyle {
  button?: string
  icon?: IconDefinition
}
