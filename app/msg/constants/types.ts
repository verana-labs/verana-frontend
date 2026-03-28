import type { Translatable } from "@/ui/dataview/types";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type MessageType =
  | "MsgAddDID" | "MsgRenewDID" | "MsgTouchDID" | "MsgRemoveDID" // DID
  | "MsgReclaimTrustDepositYield" | "MsgReclaimTrustDeposit" | "MsgRepaySlashedTrustDeposit" // TD
  | "MsgCreateTrustRegistry" | "MsgUpdateTrustRegistry" | "MsgArchiveTrustRegistry" | "MsgUnarchiveTrustRegistry" // TR
  | "MsgAddGovernanceFrameworkDocument" | "MsgIncreaseActiveGovernanceFrameworkVersion" // TR
  | "MsgCreateCredentialSchema" | "MsgUpdateCredentialSchema" | "MsgArchiveCredentialSchema" | "MsgUnarchiveCredentialSchema"// CS
  | "MsgCancelPermissionVPLastRequest" | "MsgRenewPermissionVP" | "MsgSetPermissionVPToValidated" | "MsgStartPermissionVP" // VP PERM
  | "MsgAdjustPermission" | "MsgRevokePermission" | "MsgSlashPermissionTrustDeposit" | "MsgRepayPermissionSlashedTrustDeposit" // PERM
  | "MsgCreateRootPermission" | "MsgCreatePermission" ; // PERM

export interface MsgTypeInfoI18n {
  label: Translatable;
  description: Translatable;
  cost: Translatable;
  warning?: Translatable;
}

export interface MsgTypeStyle {
  button?: string,
  icon?: IconDefinition;
}
