'use client';

// Restrict allowed actions to valid message types
export type MsgTypeDID = 'MsgAddDID' | 'MsgRenewDID' | 'MsgTouchDID' | 'MsgRemoveDID';

// Explicit type for supported Trust Deposit actions
export type MsgTypeTD = 'MsgReclaimTrustDeposit' | 'MsgReclaimTrustDepositYield';

// Supported Trust Registry actions
export type MsgTypeTR = 'CreateTrustRegistry' | 'UpdateTrustRegistry' | 'ArchiveTrustRegistry';

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
  CreateTrustRegistry: 'Trust Registry created successfully!',
  UpdateTrustRegistry: 'Trust Registry updated successfully!',
  ArchiveTrustRegistry: 'Trust Registry archived successfully!',
};

export const MSG_INPROGRESS_ACTION_TR: Record<MsgTypeTR, string> = {
  CreateTrustRegistry: 'Creating Trust Registry...',
  UpdateTrustRegistry: 'Updating Trust Registry...',
  ArchiveTrustRegistry: 'Archiving Trust Registry...',
};

export const MSG_ERROR_ACTION_TR: Record<
  MsgTypeTR,
  (id: string | number | undefined, code?: number, msg?: string) => string
> = {
  CreateTrustRegistry: (id, code, msg) => `Failed to create Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  UpdateTrustRegistry: (id, code, msg) => `Failed to update Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
  ArchiveTrustRegistry: (id, code, msg) => `Failed to archive Trust Registry${id ? ` ${id}` : ''}. ${code ? `(${code}) ` : ''}${msg ?? ''}`,
};