import { faBan, faCheck, faClockRotateLeft, faCopy, faEye, faHandHoldingDollar, faRotate, faTriangleExclamation, faUpRightFromSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ReactNode } from "react";
import { formatDate, formatVNA } from "@/util/util";

export type PermissionType =
  | "ECOSYSTEM"
  | "ISSUER_GRANTOR"
  | "VERIFIER_GRANTOR"
  | "ISSUER"
  | "VERIFIER"
  | "HOLDER";

export type VpState =
  | "PENDING"
  | "VALIDATED"
  | "TERMINATED"
  | "VALIDATION_STATE_UNSPECIFIED";

/**
 * API Permission payload (dates are ISO strings)
 */
export interface Permission {
  id: string;
  schema_id: string;
  type: PermissionType;
  did: string;
  grantee: string;
  created_by: string;
  created: string;  // ISO datetime
  modified: string; // ISO datetime
  modified_by: string;
  extended: string; // ISO datetime
  extended_by: string;
  slashed: string;  // ISO datetime
  slashed_by: string;
  repaid: string;   // ISO datetime
  repaid_by: string;
  effective_from: string;   // ISO datetime
  effective_until: string;  // ISO datetime
  revoked: string;  // ISO datetime
  revoked_by: string;
  country: string;
  validation_fees: string;
  issuance_fees: string;
  verification_fees: string;
  deposit: string;
  slashed_deposit: string;
  repaid_deposit: string;
  validator_perm_id: string;
  vp_state: VpState;
  vp_last_state_change: string; // ISO datetime
  vp_current_fees: string;
  vp_current_deposit: string;
  vp_summary_digest_sri: string;
  vp_exp: string;   // ISO datetime
  vp_validator_deposit: string;
  vp_term_requested: string;    // ISO datetime
  perm_state: string;
  grantee_available_actions: string[];
  validator_available_actions: string[];
  weight: string;
  issued: string;
  verified: string;
};
export interface PermissionHistory {
  permission_id: string;
  schema_id: string,
  type: string;
  grantee: string;
  event_type: string;
  height: string;
  changes: object;
  created_at: string;   // ISO datetime
};

type PermissionKey = keyof Permission;

export type PermissionAction = {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  name?: string;
  buttonClass?: string;
};

type PermissionItem = {
  label: string;
  attr: PermissionKey;
  mono?: boolean;
  extraActions?: PermissionAction[];
  format?: (v: Permission[PermissionKey]) => ReactNode;
};

export const permissionMetaItems: PermissionItem[] = [
  {
    label: "DID",
    attr: "did",
    mono: true,
    extraActions: [
      { icon: faCopy, label: "copy", onClick: () => console.log("copyAttr(item.attr)") },
      { icon: faEye, label: "visualizer", onClick: () => console.log("visualizer DID", "permission?.did") },
      { icon: faUpRightFromSquare, label: "service", onClick: () => console.log("service") },
    ],
  },
  {
    label: "Grantee",
    attr: "grantee",
    mono: true,
    extraActions: [
      { icon: faCopy, label: "copy", onClick: () => console.log("copyAttr(item.attr)") },
      { icon: faEye, label: "visualizer", onClick: () => console.log("visualizer grantee", "permission?.grantee") },
      { icon: faUpRightFromSquare, label: "explorer", onClick: () => console.log(`openUrl("https://explorer.verana.io")`) },
    ],
  },
  {
    label: "ID",
    attr: "id",
    mono: true,
    extraActions: [
      { icon: faCopy, label: "copy", onClick: () => console.log("copyAttr(item.attr)") },
      { icon: faEye, label: "visualizer", onClick: () => console.log("visualizer id", "permission?.id") }],
  },
  { label: "Deposit", attr: "deposit", mono: true, format: (value) => formatVNA(String(value)) },
  { label: "Effective From", attr: "effective_from", format: (value) => formatDate(value as string) },
  { label: "Effective Until", attr: "effective_until", format: (value) => formatDate(value as string) },
  { label: "Country", attr: "country" },
  { label: "Issued Credentials", attr: "issued" },
  { label: "Verified Credentials", attr: "verified" },
];

export const permissionLifecycle: PermissionItem[] = [
  { label: "Created", attr: "created", format: (value) => formatDate(value as string) },
  { label: "Created By", attr: "created_by", mono: true},
  { label: "Modified", attr: "modified", format: (value) => formatDate(value as string) },
  { label: "Modified By", attr: "modified_by", mono: true },
  { label: "Extended", attr: "extended", format: (value) => formatDate(value as string) },
  { label: "Extended By", attr: "extended_by", mono: true },
];

export const permissionActionLifecycle: PermissionAction[] = [
  { name: "PERM_EXTEND", icon: faClockRotateLeft, label: "Extend Permission", onClick: () => console.log("Extend Permission") },
  { name: "PERM_REVOKE", icon: faBan, label: "Revoke Permission", onClick: () => console.log("Revoke Permission"),
    buttonClass: "bg-red-600 hover:bg-red-700"}
];

export const permissionValidationProcess: PermissionItem[] = [
  { label: "VP Expiration", attr: "vp_exp", format: (value) => formatDate(value as string) },
  { label: "VP Last State Change", attr: "vp_last_state_change"},
  { label: "VP Validator Deposit", attr: "vp_validator_deposit", format: (value) => formatVNA(String(value)), mono: true },
  { label: "VP Current Fees", attr: "vp_current_fees", format: (value) => formatVNA(String(value)), mono: true },
  { label: "VP Current Deposit", attr: "vp_current_deposit", format: (value) => formatVNA(String(value)), mono: true },
  { label: "VP Summary Digest", attr: "vp_summary_digest_sri", mono: true },
];

export const permissionActionValidationProcess: PermissionAction[] = [
  { name: "VP_RENEW", icon: faRotate, label: "Renew Validation Process", onClick: () => console.log("Renew Validation Process") },
  { name: "VP_CANCEL", icon: faXmark, label: "Cancel Request", onClick: () => console.log("Cancel Request"),
    buttonClass: "bg-gray-600 hover:bg-gray-700"
   },
  { name: "VP_SET_VALIDATED", icon: faCheck, label: "Accept and Set Validated", onClick: () => console.log("Accept and Set Validated"),
    buttonClass: "bg-green-600 hover:bg-green-700"
   },
];

export const permissionBusinessModels: PermissionItem[] = [
  { label: "Validation Fees", attr: "validation_fees", format: (value) => formatVNA(String(value)), mono: true },
  { label: "Issuance Fees", attr: "issuance_fees", format: (value) => formatVNA(String(value)), mono: true },
  { label: "Verification Fees", attr: "verification_fees", format: (value) => formatVNA(String(value)), mono: true },
];

export const permissionSlashing: PermissionItem[] = [
  { label: "Slashed Deposit", attr: "slashed_deposit", format: (value) => formatVNA(String(value)), mono: true },
  { label: "Repaid Deposit", attr: "repaid_deposit", format: (value) => formatVNA(String(value)), mono: true },
];

export const permissionActionSlashing: PermissionAction[] = [
  { name: "PERM_SLASH", icon: faTriangleExclamation, label: "Slash Deposit", onClick: () => console.log("Slash Deposit"),
    buttonClass: "bg-red-600 hover:bg-red-700"
  },
  { name: "PERM_REPAY", icon: faHandHoldingDollar, label: "Repay Slashed Deposit", onClick: () => console.log("Repay Slashed Deposit"),
    buttonClass: "bg-green-600 hover:bg-green-700"
  },
];

export const permissionAction: PermissionAction[] = [
  { name: "VP_SET_VALIDATED", icon: faCheck, label: "Approve", onClick: () => console.log("Approve Permission"),
    buttonClass: "bg-green-600 hover:bg-green-700"
   },
  { name: "VP_CANCEL", icon: faXmark, label: "Reject", onClick: () => console.log("Reject Request"),
    buttonClass: "bg-red-600 hover:bg-red-700"
   },
  { name: "PERM_EXTEND", icon: faClockRotateLeft, label: "Extend", onClick: () => console.log("Extend Permission") },
];
