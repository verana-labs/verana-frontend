'use client';

import { useActionCS } from "@/app/msg/credential-schema/actionCS";
import { useActionTR } from "@/app/msg/trust-registry/actionTR";
import { MessageType } from "@/app/constants/msgTypeConfig";

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
        "trId",
        "issuerGrantorValidationValidityPeriod",
        "verifierGrantorValidationValidityPeriod",
        "issuerValidationValidityPeriod",
        "verifierValidationValidityPeriod",
        "holderValidationValidityPeriod"
    ],
    MsgArchiveCredentialSchema: ["id","trId"],

    // TR
    MsgCreateTrustRegistry: ["did", "aka", "language", "docUrl"],
    MsgUpdateTrustRegistry: ["id", "did", "aka", "language", "docUrl"],
    MsgArchiveTrustRegistry: ["id"],
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
    MsgRepaySlashedTrustDeposit: []
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
export function useSubmitTxMsgTypeFromObject() {
    // Hooks are called at top-level (safe according to the Rules of Hooks)
    const actionCS = useActionCS() as unknown as ActionHandler;
    const actionTR = useActionTR() as unknown as ActionHandler;

    /**
     * Returns the action hook implementation for a given MessageType.
     * Hooks are called unconditionally here, so we respect Rules of Hooks.
     */
    const selectActionFor = (msgType: MessageType) : ActionHandler => {
      if (
        msgType === "MsgCreateCredentialSchema" ||
        msgType === "MsgUpdateCredentialSchema" ||
        msgType === "MsgArchiveCredentialSchema"
      ) return actionCS;

      if (
        msgType === "MsgCreateTrustRegistry" ||
        msgType === "MsgUpdateTrustRegistry" ||
        msgType === "MsgArchiveTrustRegistry"
      ) return actionTR;

      // Exhaustiveness guard
      throw new Error(`Unsupported MsgType: ${msgType}`);
    };

    async function submitTx(msgType: MessageType, raw: unknown) {
      if (!isRecord(raw)) throw new Error("Payload must be an object");
      const action = selectActionFor(msgType);
      const keys = requiredFieldsByMsgType[msgType] ?? [];

      const src = raw as Record<string, unknown>;
      const payload: Record<string, unknown> = { msgType, creator: "", tr_id: src['trId'] };

      for (const k of keys) payload[k] = src[k];

      return action(payload);
    }
  return { submitTx };
}