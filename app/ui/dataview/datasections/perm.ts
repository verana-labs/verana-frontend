import { faBan, faCheck, faClockRotateLeft, faCopy, faEye, faHandHoldingDollar, faRotate, faTriangleExclamation, faUpRightFromSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ReactNode } from "react";
import { formatDate, formatVNA } from "@/util/util";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../types";

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
  expire_soon: boolean;
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
      { icon: faCopy, label: resolveTranslatable({key: "permissioncard.action.copy"}, translate)?? "copy", onClick: () => console.log("copyAttr(item.attr)") },
      { icon: faEye, label: resolveTranslatable({key: "permissioncard.action.visualizer"}, translate)?? "visualizer", onClick: () => console.log("visualizer DID", "permission?.did") },
      { icon: faUpRightFromSquare, label: resolveTranslatable({key: "permissioncard.action.service"}, translate)?? "service", onClick: () => console.log("service") },
    ],
  },
  {
    label: "Grantee",
    attr: "grantee",
    mono: true,
    extraActions: [
      { icon: faCopy, label: resolveTranslatable({key: "permissioncard.action.copy"}, translate)?? "copy", onClick: () => console.log("copyAttr(item.attr)") },
      { icon: faEye, label: resolveTranslatable({key: "permissioncard.action.visualizer"}, translate)?? "visualizer", onClick: () => console.log("visualizer grantee", "permission?.grantee") },
      { icon: faUpRightFromSquare, label: resolveTranslatable({key: "permissioncard.action.explorer"}, translate)?? "explorer", onClick: () => console.log(`openUrl("https://explorer.verana.io")`) },
    ],
  },
  {
    label: "ID",
    attr: "id",
    mono: true,
    extraActions: [
      { icon: faCopy, label: resolveTranslatable({key: "permissioncard.action.copy"}, translate)?? "copy", onClick: () => console.log("copyAttr(item.attr)") },
      { icon: faEye, label: resolveTranslatable({key: "permissioncard.action.visualizer"}, translate)?? "visualizer", onClick: () => console.log("visualizer id", "permission?.id") }],
  },
  { label: resolveTranslatable({key: "permissioncard.meta.deposit"}, translate)?? "Deposit", attr: "deposit", mono: true, format: (value) => formatVNA(String(value)) },
  { label: resolveTranslatable({key: "permissioncard.meta.effectivefrom"}, translate)?? "Effective From", attr: "effective_from", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.meta.effectiveuntil"}, translate)?? "Effective Until", attr: "effective_until", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.meta.country"}, translate)?? "Country", attr: "country" },
  { label: resolveTranslatable({key: "permissioncard.meta.issued"}, translate)?? "Issued Credentials", attr: "issued" },
  { label: resolveTranslatable({key: "permissioncard.meta.verified"}, translate)?? "Verified Credentials", attr: "verified" },
];

export const permissionLifecycle: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.lifecycle.created"}, translate)?? "Created", attr: "created", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.lifecycle.createdby"}, translate)?? "Created By", attr: "created_by", mono: true},
  { label: resolveTranslatable({key: "permissioncard.lifecycle.modified"}, translate)?? "Modified", attr: "modified", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.lifecycle.modifiedby"}, translate)?? "Modified By", attr: "modified_by", mono: true },
  { label: resolveTranslatable({key: "permissioncard.lifecycle.extended"}, translate)?? "Extended", attr: "extended", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.lifecycle.extendedby"}, translate)?? "Extended By", attr: "extended_by", mono: true },
];

export const permissionActionLifecycle: PermissionAction[] = [
  { name: "PERM_EXTEND", icon: faClockRotateLeft, label: resolveTranslatable({key: "permissioncard.lifecycle.action.permextend"}, translate)?? "Extend Permission", onClick: () => console.log("Extend Permission") },
  { name: "PERM_REVOKE", icon: faBan, label: resolveTranslatable({key: "permissioncard.lifecycle.action.permrevoke"}, translate)?? "Revoke Permission", onClick: () => console.log("Revoke Permission"),
    buttonClass: "bg-red-600 hover:bg-red-700"}
];

export const permissionValidationProcess: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpexp"}, translate)?? "VP Expiration", attr: "vp_exp", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vplaststatechange"}, translate)?? "VP Last State Change", attr: "vp_last_state_change"},
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpvalidatordeposit"}, translate)?? "VP Validator Deposit", attr: "vp_validator_deposit", format: (value) => formatVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpcurrentfees"}, translate)?? "VP Current Fees", attr: "vp_current_fees", format: (value) => formatVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpcurrentdeposit"}, translate)?? "VP Current Deposit", attr: "vp_current_deposit", format: (value) => formatVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpsummarydigestsri"}, translate)?? "VP Summary Digest", attr: "vp_summary_digest_sri", mono: true },
];

export const permissionActionValidationProcess: PermissionAction[] = [
  { name: "VP_RENEW", icon: faRotate, label: resolveTranslatable({key: "permissioncard.validationprocess.action.vprenew"}, translate)?? "Renew Validation Process", onClick: () => console.log("Renew Validation Process") },
  { name: "VP_CANCEL", icon: faXmark, label: resolveTranslatable({key: "permissioncard.validationprocess.action.vpcancel"}, translate)?? "Cancel Request", onClick: () => console.log("Cancel Request"),
    buttonClass: "bg-gray-600 hover:bg-gray-700"
   },
  { name: "VP_SET_VALIDATED", icon: faCheck, label: resolveTranslatable({key: "permissioncard.validationprocess.action.vpsetvalidated"}, translate)?? "Accept and Set Validated", onClick: () => console.log("Accept and Set Validated"),
    buttonClass: "bg-green-600 hover:bg-green-700"
   },
];

export const permissionBusinessModels: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.businessmodels.validationfees"}, translate)?? "Validation Fees", attr: "validation_fees", format: (value) => formatVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.businessmodels.issuancefees"}, translate)?? "Issuance Fees", attr: "issuance_fees", format: (value) => formatVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.businessmodels.verificationfees"}, translate)?? "Verification Fees", attr: "verification_fees", format: (value) => formatVNA(String(value)), mono: true },
];

export const permissionSlashing: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.slashing.slasheddeposit"}, translate)?? "Slashed Deposit", attr: "slashed_deposit", format: (value) => formatVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.slashing.repaiddeposit"}, translate)?? "Repaid Deposit", attr: "repaid_deposit", format: (value) => formatVNA(String(value)), mono: true },
];

export const permissionActionSlashing: PermissionAction[] = [
  { name: "PERM_SLASH", icon: faTriangleExclamation, label: resolveTranslatable({key: "permissioncard.slashing.action.permslash"}, translate)?? "Slash Deposit", onClick: () => console.log("Slash Deposit"),
    buttonClass: "bg-red-600 hover:bg-red-700"
  },
  { name: "PERM_REPAY", icon: faHandHoldingDollar, label: resolveTranslatable({key: "permissioncard.slashing.action.permrepay"}, translate)?? "Repay Slashed Deposit", onClick: () => console.log("Repay Slashed Deposit"),
    buttonClass: "bg-green-600 hover:bg-green-700"
  },
];

export const permissionActionTasks: PermissionAction[] = [
  { name: "VP_SET_VALIDATED", icon: faCheck, label: resolveTranslatable({key: "permissioncard.tasks.action.vpsetvalidated"}, translate)?? "Approve", onClick: () => console.log("Approve Permission"),
    buttonClass: "bg-green-600 hover:bg-green-700"
   },
  { name: "VP_CANCEL", icon: faXmark, label: resolveTranslatable({key: "permissioncard.tasks.action.vpcancel"}, translate)?? "Reject", onClick: () => console.log("Reject Request"),
    buttonClass: "bg-red-600 hover:bg-red-700"
   },
  { name: "PERM_EXTEND", icon: faClockRotateLeft, label: resolveTranslatable({key: "permissioncard.tasks.action.permextend"}, translate)?? "Extend", onClick: () => console.log("Extend Permission") },
];
