import type { Translatable } from "@/ui/dataview/types";

export type MessageType =
  | "MsgAddDID" | "MsgRenewDID" | "MsgTouchDID" | "MsgRemoveDID"              // DID
  | "MsgReclaimTrustDepositYield" | "MsgReclaimTrustDeposit" | "MsgRepaySlashedTrustDeposit" // TD
  | "MsgCreateTrustRegistry" | "MsgUpdateTrustRegistry" | "MsgArchiveTrustRegistry"
  | "MsgAddGovernanceFrameworkDocument" | "MsgIncreaseActiveGovernanceFrameworkVersion" // TR
  | "MsgCreateCredentialSchema" | "MsgUpdateCredentialSchema" | "MsgArchiveCredentialSchema"; // CS

export interface MsgTypeInfoI18n {
  label: Translatable;
  description: Translatable;
  cost: Translatable;
}