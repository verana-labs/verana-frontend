'use client'

import { translate } from '@/i18n/dataview'
import { I18nValues, resolveTranslatable, Translatable } from '@/ui/dataview/types'

export type MsgTypeTD = 'MsgReclaimTrustDepositYield' | 'MsgRepaySlashedTrustDeposit'

// Supported Ecosystem actions
export type MsgTypeEcosystem =
  | 'MsgCreateEcosystem'
  | 'MsgUpdateEcosystem'
  | 'MsgArchiveEcosystem'
  | 'MsgUnarchiveEcosystem'
  | 'MsgAddGovernanceFrameworkDocument'
  | 'MsgIncreaseActiveGovernanceFrameworkVersion'

// Supported Credential Schema actions
export type MsgTypeCS =
  | 'MsgCreateCredentialSchema'
  | 'MsgUpdateCredentialSchema'
  | 'MsgArchiveCredentialSchema'
  | 'MsgUnarchiveCredentialSchema'

// Supported Participant actions
export type MsgTypeParticipant =
  | 'MsgStartParticipantOP'
  | 'MsgRenewParticipantOP'
  | 'MsgSetParticipantOPToValidated'
  | 'MsgCancelParticipantOPLastRequest'
  | 'MsgCreateRootParticipant'
  | 'MsgSetParticipantEffectiveUntil'
  | 'MsgRevokeParticipant'
  | 'MsgCreateOrUpdateParticipantSession'
  | 'MsgSlashParticipantTrustDeposit'
  | 'MsgRepayParticipantSlashedTrustDeposit'
  | 'MsgSelfCreateParticipant'

/** Safely cast any object to I18nValues */
function toI18nValues(values?: Record<string, unknown>): I18nValues | undefined {
  if (!values) return undefined
  const out: I18nValues = {}
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      out[k] = v
    } else {
      out[k] = String(v) // fallback for non-primitive values
    }
  }
  return out
}

/** Translate helper compatible with Translatable and I18nValues */
function t(key: string, values?: Record<string, unknown>): string {
  const tr: Translatable = { key, values: toI18nValues(values) }
  return resolveTranslatable(tr, translate) ?? key
}

export const MSG_SUCCESS_ACTION_TD: Record<MsgTypeTD, (claimed?: string) => string> = {
  MsgReclaimTrustDepositYield: () => t('notification.MsgReclaimTrustDepositYield.success'),
  MsgRepaySlashedTrustDeposit: () => t('notification.MsgRepaySlashedTrustDeposit.success'),
}

export const MSG_INPROGRESS_ACTION_TD: Record<MsgTypeTD, () => string> = {
  MsgReclaimTrustDepositYield: () => t('notification.MsgReclaimTrustDepositYield.inprogress'),
  MsgRepaySlashedTrustDeposit: () => t('notification.MsgRepaySlashedTrustDeposit.inprogress'),
}

export const MSG_ERROR_ACTION_TD: Record<MsgTypeTD, (code?: number, msg?: string) => string> = {
  MsgReclaimTrustDepositYield: (code, msg) =>
    t('notification.MsgReclaimTrustDepositYield.error', { code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgRepaySlashedTrustDeposit: (code, msg) =>
    t('notification.MsgRepaySlashedTrustDeposit.error', { code: code ? `(${code}) ` : '', msg: msg ?? '' }),
}

// ============================================================================
// ECOSYSTEM ACTIONS
// ============================================================================

// Constants for success, error, and in-progress messages for each action

export const MSG_SUCCESS_ACTION_ECOSYSTEM: Record<MsgTypeEcosystem, () => string> = {
  MsgCreateEcosystem: () => t('notification.MsgCreateEcosystem.success'),
  MsgUpdateEcosystem: () => t('notification.MsgUpdateEcosystem.success'),
  MsgArchiveEcosystem: () => t('notification.MsgArchiveEcosystem.success'),
  MsgUnarchiveEcosystem: () => t('notification.MsgUnarchiveEcosystem.success'),
  MsgAddGovernanceFrameworkDocument: () => t('notification.MsgAddGovernanceFrameworkDocument.success'),
  MsgIncreaseActiveGovernanceFrameworkVersion: () =>
    t('notification.MsgIncreaseActiveGovernanceFrameworkVersion.success'),
}

export const MSG_INPROGRESS_ACTION_ECOSYSTEM: Record<MsgTypeEcosystem, () => string> = {
  MsgCreateEcosystem: () => t('notification.MsgCreateEcosystem.inprogress'),
  MsgUpdateEcosystem: () => t('notification.MsgUpdateEcosystem.inprogress'),
  MsgArchiveEcosystem: () => t('notification.MsgArchiveEcosystem.inprogress'),
  MsgUnarchiveEcosystem: () => t('notification.MsgUnarchiveEcosystem.inprogress'),
  MsgAddGovernanceFrameworkDocument: () => t('notification.MsgAddGovernanceFrameworkDocument.inprogress'),
  MsgIncreaseActiveGovernanceFrameworkVersion: () =>
    t('notification.MsgIncreaseActiveGovernanceFrameworkVersion.inprogress'),
}

export const MSG_ERROR_ACTION_ECOSYSTEM: Record<
  MsgTypeEcosystem,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  MsgCreateEcosystem: (id, code, msg) =>
    t('notification.MsgCreateEcosystem.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgUpdateEcosystem: (id, code, msg) =>
    t('notification.MsgUpdateEcosystem.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgArchiveEcosystem: (id, code, msg) =>
    t('notification.MsgArchiveEcosystem.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgUnarchiveEcosystem: (id, code, msg) =>
    t('notification.MsgUnarchiveEcosystem.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgAddGovernanceFrameworkDocument: (id, code, msg) =>
    t('notification.MsgAddGovernanceFrameworkDocument.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgIncreaseActiveGovernanceFrameworkVersion: (id, code, msg) =>
    t('notification.MsgIncreaseActiveGovernanceFrameworkVersion.error', {
      id,
      code: code ? `(${code}) ` : '',
      msg: msg ?? '',
    }),
}

// ============================================================================
// CREDENTIAL SCHEMA ACTIONS
// ============================================================================

// Success messages for CS actions
export const MSG_SUCCESS_ACTION_CS: Record<MsgTypeCS, () => string> = {
  MsgCreateCredentialSchema: () => t('notification.MsgCreateCredentialSchema.success'),
  MsgUpdateCredentialSchema: () => t('notification.MsgUpdateCredentialSchema.success'),
  MsgArchiveCredentialSchema: () => t('notification.MsgArchiveCredentialSchema.success'),
  MsgUnarchiveCredentialSchema: () => t('notification.MsgUnarchiveCredentialSchema.success'),
}

// In-progress messages for CS actions
export const MSG_INPROGRESS_ACTION_CS: Record<MsgTypeCS, () => string> = {
  MsgCreateCredentialSchema: () => t('notification.MsgCreateCredentialSchema.inprogress'),
  MsgUpdateCredentialSchema: () => t('notification.MsgUpdateCredentialSchema.inprogress'),
  MsgArchiveCredentialSchema: () => t('notification.MsgArchiveCredentialSchema.inprogress'),
  MsgUnarchiveCredentialSchema: () => t('notification.MsgUnarchiveCredentialSchema.inprogress'),
}
// Error messages for CS actions (with id + optional error code/log)
export const MSG_ERROR_ACTION_CS: Record<
  MsgTypeCS,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  MsgCreateCredentialSchema: (id, code, msg) =>
    t('notification.MsgCreateCredentialSchema.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgUpdateCredentialSchema: (id, code, msg) =>
    t('notification.MsgUpdateCredentialSchema.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgArchiveCredentialSchema: (id, code, msg) =>
    t('notification.MsgArchiveCredentialSchema.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgUnarchiveCredentialSchema: (id, code, msg) =>
    t('notification.MsgUnarchiveCredentialSchema.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
}

// ============================================================================
// PARTICIPANT ACTIONS
// ============================================================================

/**
 * Success messages for Participant actions
 */
export const MSG_SUCCESS_ACTION_PARTICIPANT: Record<MsgTypeParticipant, (id: string | number | undefined) => string> = {
  MsgStartParticipantOP: (id) => t('notification.MsgStartParticipantOP.success', { id }),
  MsgRenewParticipantOP: () => t('notification.MsgRenewParticipantOP.success'),
  MsgSetParticipantOPToValidated: () => t('notification.MsgSetParticipantOPToValidated.success'),
  MsgCancelParticipantOPLastRequest: () => t('notification.MsgCancelParticipantOPLastRequest.success'),
  MsgCreateRootParticipant: (id) => t('notification.MsgCreateRootParticipant.success', { id }),
  MsgSetParticipantEffectiveUntil: () => t('notification.MsgSetParticipantEffectiveUntil.success'),
  MsgRevokeParticipant: () => t('notification.MsgRevokeParticipant.success'),
  MsgCreateOrUpdateParticipantSession: () => t('notification.MsgCreateOrUpdateParticipantSession.success'),
  MsgSlashParticipantTrustDeposit: () => t('notification.MsgSlashParticipantTrustDeposit.success'),
  MsgRepayParticipantSlashedTrustDeposit: () => t('notification.MsgRepayParticipantSlashedTrustDeposit.success'),
  MsgSelfCreateParticipant: (id) => t('notification.MsgSelfCreateParticipant.success', { id }),
}

/**
 * In-progress messages for Participant actions
 */
export const MSG_INPROGRESS_ACTION_PARTICIPANT: Record<MsgTypeParticipant, () => string> = {
  MsgStartParticipantOP: () => t('notification.MsgStartParticipantOP.inprogress'),
  MsgRenewParticipantOP: () => t('notification.MsgRenewParticipantOP.inprogress'),
  MsgSetParticipantOPToValidated: () => t('notification.MsgSetParticipantOPToValidated.inprogress'),
  MsgCancelParticipantOPLastRequest: () => t('notification.MsgCancelParticipantOPLastRequest.inprogress'),
  MsgCreateRootParticipant: () => t('notification.MsgCreateRootParticipant.inprogress'),
  MsgSetParticipantEffectiveUntil: () => t('notification.MsgSetParticipantEffectiveUntil.inprogress'),
  MsgRevokeParticipant: () => t('notification.MsgRevokeParticipant.inprogress'),
  MsgCreateOrUpdateParticipantSession: () => t('notification.MsgCreateOrUpdateParticipantSession.inprogress'),
  MsgSlashParticipantTrustDeposit: () => t('notification.MsgSlashParticipantTrustDeposit.inprogress'),
  MsgRepayParticipantSlashedTrustDeposit: () => t('notification.MsgRepayParticipantSlashedTrustDeposit.inprogress'),
  MsgSelfCreateParticipant: () => t('notification.MsgSelfCreateParticipant.inprogress'),
}

/**
 * Error messages for Participant actions (with id + optional error code/log)
 */
export const MSG_ERROR_ACTION_PARTICIPANT: Record<
  MsgTypeParticipant,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  MsgStartParticipantOP: (id, code, msg) =>
    t('notification.MsgStartParticipantOP.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgRenewParticipantOP: (id, code, msg) =>
    t('notification.MsgRenewParticipantOP.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgSetParticipantOPToValidated: (id, code, msg) =>
    t('notification.MsgSetParticipantOPToValidated.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgCancelParticipantOPLastRequest: (id, code, msg) =>
    t('notification.MsgCancelParticipantOPLastRequest.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgCreateRootParticipant: (id, code, msg) =>
    t('notification.MsgCreateRootParticipant.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgSetParticipantEffectiveUntil: (id, code, msg) =>
    t('notification.MsgSetParticipantEffectiveUntil.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgRevokeParticipant: (id, code, msg) =>
    t('notification.MsgRevokeParticipant.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgCreateOrUpdateParticipantSession: (id, code, msg) =>
    t('notification.MsgCreateOrUpdateParticipantSession.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgSlashParticipantTrustDeposit: (id, code, msg) =>
    t('notification.MsgSlashParticipantTrustDeposit.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgRepayParticipantSlashedTrustDeposit: (id, code, msg) =>
    t('notification.MsgRepayParticipantSlashedTrustDeposit.error', {
      id,
      code: code ? `(${code}) ` : '',
      msg: msg ?? '',
    }),
  MsgSelfCreateParticipant: (id, code, msg) =>
    t('notification.MsgSelfCreateParticipant.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
}
