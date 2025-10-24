'use client';

import { translate } from '@/i18n/dataview';
import { I18nValues, resolveTranslatable, Translatable } from '@/ui/dataview/types';

// Restrict allowed actions to valid message types
export type MsgTypeDID = 'MsgAddDID' | 'MsgRenewDID' | 'MsgTouchDID' | 'MsgRemoveDID';

// Explicit type for supported Trust Deposit actions
export type MsgTypeTD = 'MsgReclaimTrustDeposit' | 'MsgReclaimTrustDepositYield';

// Supported Trust Registry actions
export type MsgTypeTR = 'MsgCreateTrustRegistry' | 'MsgUpdateTrustRegistry' | 'MsgArchiveTrustRegistry' | 'MsgAddGovernanceFrameworkDocument' | 'MsgIncreaseActiveGovernanceFrameworkVersion';

// Supported Credential Schema actions
export type MsgTypeCS = 'MsgCreateCredentialSchema' | 'MsgUpdateCredentialSchema' | 'MsgArchiveCredentialSchema';

/** Safely cast any object to I18nValues */
function toI18nValues(values?: Record<string, unknown>): I18nValues | undefined {
  if (!values) return undefined;
  const out: I18nValues = {};
  for (const [k, v] of Object.entries(values)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null
    ) {
      out[k] = v;
    } else {
      out[k] = String(v); // fallback for non-primitive values
    }
  }
  return out;
}

/** Translate helper compatible with Translatable and I18nValues */
function t(key: string, values?: Record<string, unknown>): string {
  const tr: Translatable = { key, values: toI18nValues(values) };
  return resolveTranslatable(tr, translate) ?? key;
}

// ============================================================================
// DID ACTIONS
// ============================================================================

// Constants for user notifications per DID action

export const MSG_SUCCESS_ACTION_DID: Record<MsgTypeDID, (did: string) => string> = {
  MsgAddDID: (did) => t('notification.MsgAddDID.success', { did }),
  MsgRenewDID: (did) => t('notification.MsgRenewDID.success', { did }),
  MsgTouchDID: (did) => t('notification.MsgTouchDID.success', { did }),
  MsgRemoveDID: (did) => t('notification.MsgRemoveDID.success', { did })
};

export const MSG_ERROR_ACTION_DID: Record<MsgTypeDID, (did: string, code?: number, msg?: string) => string> = {
  MsgAddDID: (did, code, msg) =>
    t('notification.MsgAddDID.error', { did, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgRenewDID: (did, code, msg) =>
    t('notification.MsgRenewDID.error', { did, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgTouchDID: (did, code, msg) =>
    t('notification.MsgTouchDID.error', { did, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgRemoveDID: (did, code, msg) =>
    t('notification.MsgRemoveDID.error', { did, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
};
export const MSG_INPROGRESS_ACTION_DID: Record<MsgTypeDID, (did: string) => string> = {
  MsgAddDID: (did) => t('notification.MsgAddDID.inprogress', { did }),
  MsgRenewDID: (did) => t('notification.MsgRenewDID.inprogress', { did }),
  MsgTouchDID: (did) => t('notification.MsgTouchDID.inprogress', { did }),
  MsgRemoveDID: (did) => t('notification.MsgRemoveDID.inprogress', { did }),
};

// ============================================================================
// TRUST DEPOSIT ACTIONS
// ============================================================================

// Success, error and in-progress messages per TD action

export const MSG_SUCCESS_ACTION_TD: Record<MsgTypeTD, (claimed?: string) => string> = {
  MsgReclaimTrustDeposit: (claimed) => t('notification.MsgReclaimTrustDeposit.success', { claimed }),
  MsgReclaimTrustDepositYield: () => t('notification.MsgReclaimTrustDepositYield.success'),
};

export const MSG_INPROGRESS_ACTION_TD: Record<MsgTypeTD, () => string> = {
  MsgReclaimTrustDeposit: () => t('notification.MsgReclaimTrustDeposit.inprogress'),
  MsgReclaimTrustDepositYield: () => t('notification.MsgReclaimTrustDepositYield.inprogress'),
};

export const MSG_ERROR_ACTION_TD: Record<MsgTypeTD, (code?: number, msg?: string) => string> = {
  MsgReclaimTrustDeposit: (code, msg) =>
    t('notification.MsgReclaimTrustDeposit.error', { code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgReclaimTrustDepositYield: (code, msg) =>
    t('notification.MsgReclaimTrustDepositYield.error', { code: code ? `(${code}) ` : '', msg: msg ?? '' }),  
};

// ============================================================================
// TRUST REGISTRY ACTIONS
// ============================================================================

// Constants for success, error, and in-progress messages for each action

export const MSG_SUCCESS_ACTION_TR: Record<MsgTypeTR, () => string> = {
  MsgCreateTrustRegistry: () => t('notification.MsgCreateTrustRegistry.success'),
  MsgUpdateTrustRegistry: () => t('notification.MsgUpdateTrustRegistry.success'),
  MsgArchiveTrustRegistry: () => t('notification.MsgArchiveTrustRegistry.success'),
  MsgAddGovernanceFrameworkDocument: () => t('notification.MsgAddGovernanceFrameworkDocument.success'),
  MsgIncreaseActiveGovernanceFrameworkVersion: () => t('notification.MsgIncreaseActiveGovernanceFrameworkVersion.success'),
};

export const MSG_INPROGRESS_ACTION_TR: Record<MsgTypeTR, () => string> = {
  MsgCreateTrustRegistry: () => t('notification.MsgCreateTrustRegistry.inprogress'),
  MsgUpdateTrustRegistry: () => t('notification.MsgUpdateTrustRegistry.inprogress'),
  MsgArchiveTrustRegistry: () => t('notification.MsgArchiveTrustRegistry.inprogress'),
  MsgAddGovernanceFrameworkDocument: () => t('notification.MsgAddGovernanceFrameworkDocument.inprogress'),
  MsgIncreaseActiveGovernanceFrameworkVersion: () => t('notification.MsgIncreaseActiveGovernanceFrameworkVersion.inprogress'),
};

export const MSG_ERROR_ACTION_TR: Record<
  MsgTypeTR,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  MsgCreateTrustRegistry: (id, code, msg) =>
    t('notification.MsgCreateTrustRegistry.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgUpdateTrustRegistry: (id, code, msg) =>
    t('notification.MsgUpdateTrustRegistry.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgArchiveTrustRegistry: (id, code, msg) =>
    t('notification.MsgArchiveTrustRegistry.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgAddGovernanceFrameworkDocument: (id, code, msg) =>
    t('notification.MsgAddGovernanceFrameworkDocument.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
  MsgIncreaseActiveGovernanceFrameworkVersion: (id, code, msg) =>
    t('notification.MsgIncreaseActiveGovernanceFrameworkVersion.error', { id, code: code ? `(${code}) ` : '', msg: msg ?? '' }),
};

// ============================================================================
// CREDENTIAL SCHEMA ACTIONS
// ============================================================================

// Success messages for CS actions
export const MSG_SUCCESS_ACTION_CS: Record<MsgTypeCS, () => string> = {
  MsgCreateCredentialSchema: () => t('notification.MsgCreateCredentialSchema.success'),
  MsgUpdateCredentialSchema: () => t('notification.MsgUpdateCredentialSchema.success'),
  MsgArchiveCredentialSchema: () => t('notification.MsgArchiveCredentialSchema.success'),
};

// In-progress messages for CS actions
export const MSG_INPROGRESS_ACTION_CS: Record<MsgTypeCS, () => string> = {
  MsgCreateCredentialSchema: () => t('notification.MsgCreateCredentialSchema.inprogress'),
  MsgUpdateCredentialSchema: () => t('notification.MsgUpdateCredentialSchema.inprogress'),
  MsgArchiveCredentialSchema: () => t('notification.MsgArchiveCredentialSchema.inprogress'),
};
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
};