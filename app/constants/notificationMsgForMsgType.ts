'use client';

// Restrict allowed actions to valid message types
export type MsgTypeDID = 'MsgAddDID' | 'MsgRenewDID' | 'MsgTouchDID' | 'MsgRemoveDID';

// Explicit type for supported Trust Deposit actions
export type MsgTypeTD = 'MsgReclaimTrustDeposit' | 'MsgReclaimTrustDepositYield';

// Supported Trust Registry actions
export type MsgTypeTR = 'MsgCreateTrustRegistry' | 'MsgUpdateTrustRegistry' | 'MsgArchiveTrustRegistry' | 'MsgAddGovernanceFrameworkDocument' | 'MsgIncreaseActiveGovernanceFrameworkVersion';

// Supported Credential Schema actions
export type MsgTypeCS = 'MsgCreateCredentialSchema' | 'MsgUpdateCredentialSchema' | 'MsgArchiveCredentialSchema';

// Constants for user notifications per DID action
export const MSG_SUCCESS_ACTION_DID: Record<MsgTypeDID, (did: string) => string> = {
  MsgAddDID:    (did) => `Your DID ${did} was created successfully!`,
  MsgRenewDID:  (did) => `Your DID ${did} was renewed successfully!`,
  MsgTouchDID:  (did) => `Your DID ${did} was touched successfully!`,
  MsgRemoveDID: (did) => `Your DID ${did} was removed successfully!`
};
export const MSG_ERROR_ACTION_DID: Record<MsgTypeDID, (did: string, code?: number, msg?: string) => string> = {
  MsgAddDID:    (did, code, msg) => `Failed to create DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgRenewDID:  (did, code, msg) => `Failed to renew DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgTouchDID:  (did, code, msg) => `Failed to touch DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgRemoveDID: (did, code, msg) => `Failed to remove DID ${did}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};
export const MSG_INPROGRESS_ACTION_DID: Record<MsgTypeDID, (did: string) => string> = {
  MsgAddDID:    (did) => `Creating DID ${did}...`,
  MsgRenewDID:  (did) => `Renewing DID ${did}...`,
  MsgTouchDID:  (did) => `Touching DID ${did}...`,
  MsgRemoveDID: (did) => `Removing DID ${did}...`
};

// Success, error and in-progress messages per TD action
export const MSG_SUCCESS_ACTION_TD: Record<MsgTypeTD, (claimed?: number) => string> = {
  MsgReclaimTrustDeposit: (claimed) =>
    `Deposit reclaimed successfully!${claimed ? ` Amount: ${claimed}` : ''}`,
  MsgReclaimTrustDepositYield: () => 'Interests claimed successfully!',
};

export const MSG_INPROGRESS_ACTION_TD: Record<MsgTypeTD, () => string> = {
  MsgReclaimTrustDeposit: () => 'Reclaiming deposit...',
  MsgReclaimTrustDepositYield: () => 'Claiming interests...',
};

export const MSG_ERROR_ACTION_TD: Record<MsgTypeTD, (code?: number, msg?: string) => string> = {
  MsgReclaimTrustDeposit: (code, msg) =>
    `Failed to reclaim deposit. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgReclaimTrustDepositYield: (code, msg) =>
    `Failed to claim interests. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};

// Constants for success, error, and in-progress messages for each action
export const MSG_SUCCESS_ACTION_TR: Record<MsgTypeTR, string> = {
  MsgCreateTrustRegistry: 'Trust Registry created successfully!',
  MsgUpdateTrustRegistry: 'Trust Registry updated successfully!',
  MsgArchiveTrustRegistry: 'Trust Registry archived successfully!',
  MsgAddGovernanceFrameworkDocument: 'Governance Framework Document added successfully!',
  MsgIncreaseActiveGovernanceFrameworkVersion: 'Active Governance Framework Version increased successfully!',
};

export const MSG_INPROGRESS_ACTION_TR: Record<MsgTypeTR, string> = {
  MsgCreateTrustRegistry: 'Creating Trust Registry...',
  MsgUpdateTrustRegistry: 'Updating Trust Registry...',
  MsgArchiveTrustRegistry: 'Archiving Trust Registry...',
  MsgAddGovernanceFrameworkDocument: 'Adding Governance Framework Document...',
  MsgIncreaseActiveGovernanceFrameworkVersion: 'Increasing Active Governance Framework Version...',
};

export const MSG_ERROR_ACTION_TR: Record<
  MsgTypeTR,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  MsgCreateTrustRegistry: (id, code, msg) => `Failed to create Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgUpdateTrustRegistry: (id, code, msg) => `Failed to update Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgArchiveTrustRegistry: (id, code, msg) => `Failed to archive Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgAddGovernanceFrameworkDocument: (id, code, msg) => `Failed to add Governance Framework Document, Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgIncreaseActiveGovernanceFrameworkVersion: (id, code, msg) => `Failed to increase Active Governance Framework Version, Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};

// Success messages for CS actions
export const MSG_SUCCESS_ACTION_CS: Record<MsgTypeCS, string> = {
  MsgCreateCredentialSchema: 'Credential Schema created successfully!',
  MsgUpdateCredentialSchema: 'Credential Schema updated successfully!',
  MsgArchiveCredentialSchema: 'Credential Schema archived successfully!',
};

// In-progress messages for CS actions
export const MSG_INPROGRESS_ACTION_CS: Record<MsgTypeCS, string> = {
  MsgCreateCredentialSchema: 'Creating Credential Schema...',
  MsgUpdateCredentialSchema: 'Updating Credential Schema...',
  MsgArchiveCredentialSchema: 'Archiving Credential Schema...',
};

// Error messages for CS actions (with id + optional error code/log)
export const MSG_ERROR_ACTION_CS: Record<
  MsgTypeCS,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  MsgCreateCredentialSchema: (id, code, msg) =>
    `Failed to create Credential Schema${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgUpdateCredentialSchema: (id, code, msg) =>
    `Failed to update Credential Schema${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  MsgArchiveCredentialSchema: (id, code, msg) =>
    `Failed to archive Credential Schema${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};