import { faBan, faCheck, faClockRotateLeft, faCopy, faEye, faHandHoldingDollar, faRotate, faTriangleExclamation, faUpRightFromSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ReactNode } from "react";
import { formatDate, formatVNAFromUVNA } from "@/util/util";
import { translate } from "@/i18n/dataview";
import { Field, resolveTranslatable, Section } from "@/ui/dataview/types";
import { ActionPermParams } from "@/msg/actions_hooks/actionPerm";

const t = (key: string) => ({ key });

// Permission data (must include every field used by the sections)
export interface PermissionData {
  // Common
  creator?: string;
  country?: string;
  // Identifiers
  id?: string | number;
  schemaId?: string | number;
  validatorPermId?: string | number;
  // Role / type
  type?: PermissionType | number;
  // DID
  did?: string;
  // Dates
  effectiveFrom?: string | Date;
  effectiveUntil?: string | Date;
  // Fees
  validationFees?: string | number;
  issuanceFees?: string | number;
  verificationFees?: string | number;
  // VP validation
  vpSummaryDigestSri?: string;
  // Permission session
  issuerPermId?: string | number;
  verifierPermId?: string | number;
  agentPermId?: string | number;
  walletAgentPermId?: string | number;
  // Slashing
  amount?: string | number;
}


const commonIdentityFields = (opts?: { includeCountry?: boolean }): Field<PermissionData>[] => {
  const out: Field<PermissionData>[] = [
    {
      name: "creator",
      label: t("dataview.perm.fields.creator"),
      type: "data",
      inputType: "text",
      show: "none",
      required: true,
      update: false,
    },
    {
      name: "id",
      label: t("dataview.perm.fields.id"),
      type: "data",
      inputType: "text",
      show: "none",
      required: true,
      update: false,
    }
  ]

  if (opts?.includeCountry) {
    out.push({
      name: "country",
      label: t("dataview.perm.fields.country"),
      type: "data",
      inputType: "text",
      show: "edit create",
      required: false,
      update: true,
    });
  }

  return out;
};

const dateFields = (opts?: { from?: boolean; until?: boolean; untilRequired?: boolean }): Field<PermissionData>[] => {
  const out: Field<PermissionData>[] = [];

  if (opts?.from) {
    out.push({
      name: "effectiveFrom",
      label: t("dataview.perm.fields.effectiveFrom"),
      type: "data",
      inputType: "date",
      show: "edit create",
      required: false,
      update: true,
    });
  }

  if (opts?.until) {
    out.push({
      name: "effectiveUntil",
      label: t("dataview.perm.fields.effectiveUntil"),
      type: "data",
      inputType: "date",
      show: "edit create",
      required: opts?.untilRequired,
      update: true,
    });
  }

  return out;
};

const feeFields = (opts?: { includeIssuance?: boolean }): Field<PermissionData>[] => {
  const out: Field<PermissionData>[] = [
    {
      name: "validationFees",
      label: t("dataview.perm.fields.validationFees"),
      type: "data",
      inputType: "number",
      show: "edit create",
      required: false,
      update: true,
      validation: { type: "Long", greaterThanOrEqual: 0 },
    },
  ];

  if (opts?.includeIssuance) {
    out.push({
      name: "issuanceFees",
      label: t("dataview.perm.fields.issuanceFees"),
      type: "data",
      inputType: "number",
      show: "edit create",
      required: false,
      update: true,
      validation: { type: "Long", greaterThanOrEqual: 0 },
    });
  }

  out.push({
    name: "verificationFees",
    label: t("dataview.perm.fields.verificationFees"),
    type: "data",
    inputType: "number",
    show: "edit create",
    required: false,
    update: true,
    validation: { type: "Long", greaterThanOrEqual: 0 },
  });

  return out;
};

const commonCreateFields = (opts?: { includeType?: boolean, includeValidatorPermId?: boolean }): Field<PermissionData>[] => {
  const out: Field<PermissionData>[] = [
    {
      name: "schemaId",
      label: t("dataview.perm.fields.schemaId"),
      type: "data",
      inputType: "text",
      show: "none",
      required: true,
      update: false,
    },
    {
      name: "did",
      label: t("dataview.perm.fields.did"),
      type: "data",
      inputType: "text",
      show: "create",
      required: true,
      update: false,
      placeholder: "did:method:identifier",
      validation: { type: "DID" },
    }
  ];

  if (opts?.includeType) {
    out.push({
      name: "type",
      label: t("dataview.perm.fields.type"),
      type: "data",
      inputType: "text",
      show: "none",
      required: true,
      update: false,
    });
  }

  if (opts?.includeValidatorPermId) {
    out.push({
      name: "validatorPermId",
      label: t("dataview.perm.fields.validatorPermId"),
      type: "data",
      inputType: "text",
      show: "none",
      required: true,
      update: false,
    });
  }

  return out;
};

type MsgType = ActionPermParams["msgType"];

/* ---------- Sections factory by msgType ---------- */

export function getActionPermSections(msgType: MsgType): Section<PermissionData>[] {
  switch (msgType) {
    case "MsgStartPermissionVP":
      return [
        {
          name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields({includeCountry: true}),
            ...commonCreateFields({ includeType: true, includeValidatorPermId: true})
          ],
        },
      ];

    case "MsgSetPermissionVPToValidated":
      return [
        {
          name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields({includeCountry: true}),
            ...dateFields({ until: true }),
            ...feeFields({ includeIssuance: true }),
            {
              name: "vpSummaryDigestSri",
              label: t("dataview.perm.fields.vpSummaryDigestSri"),
              type: "data",
              inputType: "text",
              show: "none",
              required: false,
              update: false,
            },
          ],
        },
      ];

    case "MsgCreateRootPermission":
      return [
        {
          // name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields({includeCountry: true}),
            ...commonCreateFields({includeType: false}),
            ...dateFields({ from: true, until: true }),
            ...feeFields({ includeIssuance: true }),
          ],
        },
      ];

    case "MsgExtendPermission":
      return [
        {
          name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields(),
            ...dateFields({ until: true }),
          ],
        },
      ];

    case "MsgCreateOrUpdatePermissionSession":
      return [
        {
          name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields(),
            {
              name: "issuerPermId",
              label: t("dataview.perm.fields.issuerPermId"),
              type: "data",
              inputType: "text",
              show: "edit",
              required: true,
              update: true,
            },
            {
              name: "verifierPermId",
              label: t("dataview.perm.fields.verifierPermId"),
              type: "data",
              inputType: "text",
              show: "edit",
              required: true,
              update: true,
            },
            {
              name: "agentPermId",
              label: t("dataview.perm.fields.agentPermId"),
              type: "data",
              inputType: "text",
              show: "edit",
              required: true,
              update: true,
            },
            {
              name: "walletAgentPermId",
              label: t("dataview.perm.fields.walletAgentPermId"),
              type: "data",
              inputType: "text",
              show: "edit",
              required: true,
              update: true,
            },
          ],
        },
      ];

    case "MsgSlashPermissionTrustDeposit":
      return [
        {
          name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields(),
            {
              name: "amount",
              label: t("dataview.perm.fields.amount"),
              type: "data",
              inputType: "number",
              show: "edit",
              required: true,
              update: true,
              validation: { type: "Long", greaterThan: 0 },
            },
          ],
        },
      ];

    case "MsgCreatePermission":
      return [
        {
          name: t("dataview.perm.sections.main"),
          type: "basic",
          fields: [
            ...commonIdentityFields({includeCountry: true}),
            ...commonCreateFields({includeType: true}),
            ...dateFields({ from: true, until: true }),
            ...feeFields({ includeIssuance: false }),
          ],
        },
      ];

    default:
      return [];
  }
}


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
  name?: string;
  value?: string;
  icon: IconDefinition;
  label: string;
  onClick?: () => void;
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
  { label: resolveTranslatable({key: "permissioncard.meta.deposit"}, translate)?? "Deposit", attr: "deposit", mono: true, format: (value) => formatVNAFromUVNA(String(value)) },
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
  { name: "PERM_EXTEND", value: "MsgExtendPermission",
    icon: faClockRotateLeft, label: resolveTranslatable({key: "permissioncard.lifecycle.action.permextend"}, translate)?? "Extend Permission"},
  { name: "PERM_REVOKE", value: "MsgRevokePermission",
    icon: faBan, label: resolveTranslatable({key: "permissioncard.lifecycle.action.permrevoke"}, translate)?? "Revoke Permission",
    buttonClass: "bg-red-600 hover:bg-red-700"}
];

export const permissionValidationProcess: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpexp"}, translate)?? "VP Expiration", attr: "vp_exp", format: (value) => formatDate(value as string) },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vplaststatechange"}, translate)?? "VP Last State Change", attr: "vp_last_state_change"},
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpvalidatordeposit"}, translate)?? "VP Validator Deposit", attr: "vp_validator_deposit", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpcurrentfees"}, translate)?? "VP Current Fees", attr: "vp_current_fees", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpcurrentdeposit"}, translate)?? "VP Current Deposit", attr: "vp_current_deposit", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.validationprocess.vpsummarydigestsri"}, translate)?? "VP Summary Digest", attr: "vp_summary_digest_sri", mono: true },
];

export const permissionActionValidationProcess: PermissionAction[] = [
  { name: "VP_RENEW", value: "MsgRenewPermissionVP",
    icon: faRotate, label: resolveTranslatable({key: "permissioncard.validationprocess.action.vprenew"}, translate)?? "Renew Validation Process",
  },
  { name: "VP_CANCEL", value: "MsgCancelPermissionVPLastRequest",
    icon: faXmark, label: resolveTranslatable({key: "permissioncard.validationprocess.action.vpcancel"}, translate)?? "Cancel Request",
    buttonClass: "bg-gray-600 hover:bg-gray-700"
   },
  { name: "VP_SET_VALIDATED", value: "MsgSetPermissionVPToValidated",
    icon: faCheck, label: resolveTranslatable({key: "permissioncard.validationprocess.action.vpsetvalidated"}, translate)?? "Accept and Set Validated",
    buttonClass: "bg-green-600 hover:bg-green-700"
   },
];

export const permissionBusinessModels: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.businessmodels.validationfees"}, translate)?? "Validation Fees", attr: "validation_fees", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.businessmodels.issuancefees"}, translate)?? "Issuance Fees", attr: "issuance_fees", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.businessmodels.verificationfees"}, translate)?? "Verification Fees", attr: "verification_fees", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
];

export const permissionSlashing: PermissionItem[] = [
  { label: resolveTranslatable({key: "permissioncard.slashing.slasheddeposit"}, translate)?? "Slashed Deposit", attr: "slashed_deposit", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
  { label: resolveTranslatable({key: "permissioncard.slashing.repaiddeposit"}, translate)?? "Repaid Deposit", attr: "repaid_deposit", format: (value) => formatVNAFromUVNA(String(value)), mono: true },
];

export const permissionActionSlashing: PermissionAction[] = [
  { name: "PERM_SLASH", value: "MsgSlashPermissionTrustDeposit",
    icon: faTriangleExclamation, label: resolveTranslatable({key: "permissioncard.slashing.action.permslash"}, translate)?? "Slash Deposit",
    buttonClass: "bg-red-600 hover:bg-red-700"
  },
  { name: "PERM_REPAY", value: "MsgRepayPermissionSlashedTrustDeposit",
    icon: faHandHoldingDollar, label: resolveTranslatable({key: "permissioncard.slashing.action.permrepay"}, translate)?? "Repay Slashed Deposit",
    buttonClass: "bg-green-600 hover:bg-green-700"
  },
];
