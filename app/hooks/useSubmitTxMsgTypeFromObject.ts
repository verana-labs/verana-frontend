'use client';

import { useActionCS } from "@/msg/actions_hooks/actionCS";
import { useActionTR } from "@/msg/actions_hooks/actionTR";
import { MessageType } from "@/msg/constants/types";

/**
 * Define, for each MessageType, which raw keys should be included
 * in the payload passed to the action hook.
 * This is the only place you touch when adding a new MsgType.
 */
const requiredFieldsByMsgType: Record<MessageType, readonly string[]> = {
  // CS
  MsgCreateCredentialSchema: [
    "trId",
    "jsonSchema",
    "issuerGrantorValidationValidityPeriod",
    "verifierGrantorValidationValidityPeriod",
    "issuerValidationValidityPeriod",
    "verifierValidationValidityPeriod",
    "holderValidationValidityPeriod",
    "issuerPermManagementMode",
    "verifierPermManagementMode"
  ],
  MsgUpdateCredentialSchema: [
    "id",
    "issuerGrantorValidationValidityPeriod",
    "verifierGrantorValidationValidityPeriod",
    "issuerValidationValidityPeriod",
    "verifierValidationValidityPeriod",
    "holderValidationValidityPeriod"
  ],
  MsgArchiveCredentialSchema: ["id"],
  MsgUnarchiveCredentialSchema: ["id"],

  // TR
  MsgCreateTrustRegistry: ["did", "aka", "language", "docUrl"],
  MsgUpdateTrustRegistry: ["id", "did", "aka", "language", "docUrl"],
  MsgArchiveTrustRegistry: ["id"],
  MsgUnarchiveTrustRegistry: ["id"],
  MsgAddGovernanceFrameworkDocument: [],
  MsgIncreaseActiveGovernanceFrameworkVersion: [],

  // DID
  MsgAddDID: [],
  MsgRenewDID: [],
  MsgTouchDID: [],
  MsgRemoveDID: [],

  // TD
  MsgReclaimTrustDepositYield: [],
  MsgReclaimTrustDeposit: [],
  MsgRepaySlashedTrustDeposit: [],
  MsgRenewPermissionVP: [],
  MsgSetPermissionVPToValidated: [],
  MsgCancelPermissionVPLastRequest: [],
  MsgExtendPermission: [],
  MsgRevokePermission: [],
  MsgSlashPermissionTrustDeposit: [],
  MsgRepayPermissionSlashedTrustDeposit: [],
  MsgCreateRootPermission: []
};

// Generic type for an action handler
type ActionHandler = (payload: Record<string, unknown>) => Promise<unknown> | unknown;

// Simple type guard to validate that a value is an object
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Generic submit hook (no runtime validation/casting):
 * - Receives msgType + raw object
 * - Picks only the configured fields for that msgType
 * - Adds msgType + creator
 * - Dispatches via the correct action hook
 */
export function useSubmitTxMsgTypeFromObject( onCancel?: () => void,
                                              onRefresh?: () => void) {
    // Hooks are called at top-level (safe according to the Rules of Hooks)
    const actionCS = useActionCS(onCancel, onRefresh) as unknown as ActionHandler;
    const actionTR = useActionTR(onCancel, onRefresh) as unknown as ActionHandler;

    /**
     * Returns the action hook implementation for a given MessageType.
     * Hooks are called unconditionally here, so we respect Rules of Hooks.
     */
    const selectActionFor = (msgType: MessageType) : ActionHandler => {
      if (["MsgCreateCredentialSchema", "MsgUpdateCredentialSchema", "MsgArchiveCredentialSchema", "MsgUnarchiveCredentialSchema"].includes(msgType))
        return actionCS;

      if (["MsgCreateTrustRegistry", "MsgUpdateTrustRegistry", "MsgArchiveTrustRegistry", "MsgUnarchiveTrustRegistry"].includes(msgType))
        return actionTR;

      // Exhaustiveness guard
      throw new Error(`Unsupported MsgType: ${msgType}`);
    };

    async function submitTx(msgType: MessageType, raw: unknown) {
      if (!isRecord(raw)) throw new Error("Payload must be an object");
      const action = selectActionFor(msgType);
      const keys = requiredFieldsByMsgType[msgType] ?? [];

      const src = raw as Record<string, unknown>;
      const payload: Record<string, unknown> = { msgType };

      for (const k of keys) payload[k] = src[k];

      return action(payload);
    }
  return { submitTx };
}