'use client';

import {
  MsgStartPermissionVP,
  MsgRenewPermissionVP,
  MsgSetPermissionVPToValidated,
  MsgCancelPermissionVPLastRequest,
  MsgCreateRootPermission,
  MsgExtendPermission,
  MsgRevokePermission,
  MsgCreateOrUpdatePermissionSession,
  MsgSlashPermissionTrustDeposit,
  MsgRepayPermissionSlashedTrustDeposit,
  MsgCreatePermission,
} from 'proto-codecs/codec/verana/perm/v1/tx';

import { strToU64, u64ToStr, dateToIsoAmino, isoToDate } from '@/msg/util/aminoHelpers';

/**
 * Amino converter for MsgStartPermissionVP
 */
export const MsgStartPermissionVPAminoConverter = {
  aminoType: '/verana.perm.v1.MsgStartPermissionVP',
  toAmino: ({ creator, type, validatorPermId, country, did }: MsgStartPermissionVP) => ({
    creator,
    type,
    validator_perm_id: u64ToStr(validatorPermId), // uint64 -> string
    country,
    did,
  }),
  fromAmino: (value: {
    creator: string;
    type: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    validator_perm_id: string;
    country: string;
    did: string;
  }) =>
    MsgStartPermissionVP.fromPartial({
      creator: value.creator,
      type: value.type,
      validatorPermId: strToU64(value.validator_perm_id), // string -> Long (uint64)
      country: value.country,
      did: value.did,
    }),
};

/**
 * Amino converter for MsgRenewPermissionVP
 */
export const MsgRenewPermissionVPAminoConverter = {
  aminoType: '/verana.perm.v1.MsgRenewPermissionVP',
  toAmino: ({ creator, id }: MsgRenewPermissionVP) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
  }),
  fromAmino: (value: { creator: string; id: string }) =>
    MsgRenewPermissionVP.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgSetPermissionVPToValidated
 */
export const MsgSetPermissionVPToValidatedAminoConverter = {
  aminoType: '/verana.perm.v1.MsgSetPermissionVPToValidated',
  toAmino: ({
    creator,
    id,
    effectiveUntil,
    validationFees,
    issuanceFees,
    verificationFees,
    country,
    vpSummaryDigestSri,
  }: MsgSetPermissionVPToValidated) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
    effective_until: dateToIsoAmino(effectiveUntil), // Date -> ISO string (optional)
    validation_fees: u64ToStr(validationFees), // uint64 -> string
    issuance_fees: u64ToStr(issuanceFees), // uint64 -> string
    verification_fees: u64ToStr(verificationFees), // uint64 -> string
    country,
    vp_summary_digest_sri: vpSummaryDigestSri,
  }),
  fromAmino: (value: {
    creator: string;
    id: string;
    effective_until?: string;
    validation_fees: string;
    issuance_fees: string;
    verification_fees: string;
    country: string;
    vp_summary_digest_sri: string;
  }) =>
    MsgSetPermissionVPToValidated.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
      effectiveUntil: isoToDate(value.effective_until), // ISO string -> Date (optional)
      validationFees: strToU64(value.validation_fees), // string -> Long (uint64)
      issuanceFees: strToU64(value.issuance_fees), // string -> Long (uint64)
      verificationFees: strToU64(value.verification_fees), // string -> Long (uint64)
      country: value.country,
      vpSummaryDigestSri: value.vp_summary_digest_sri,
    }),
};

/**
 * Amino converter for MsgCancelPermissionVPLastRequest
 */
export const MsgCancelPermissionVPLastRequestAminoConverter = {
  aminoType: '/verana.perm.v1.MsgCancelPermissionVPLastRequest',
  toAmino: ({ creator, id }: MsgCancelPermissionVPLastRequest) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
  }),
  fromAmino: (value: { creator: string; id: string }) =>
    MsgCancelPermissionVPLastRequest.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgCreateRootPermission
 */
export const MsgCreateRootPermissionAminoConverter = {
  aminoType: '/verana.perm.v1.MsgCreateRootPermission',
  toAmino: ({
    creator,
    schemaId,
    did,
    country,
    effectiveFrom,
    effectiveUntil,
    validationFees,
    issuanceFees,
    verificationFees,
  }: MsgCreateRootPermission) => ({
    creator,
    schema_id: u64ToStr(schemaId), // uint64 -> string
    did,
    country,
    effective_from: dateToIsoAmino(effectiveFrom), // Date -> ISO string (optional)
    effective_until: dateToIsoAmino(effectiveUntil), // Date -> ISO string (optional)
    validation_fees: u64ToStr(validationFees), // uint64 -> string
    issuance_fees: u64ToStr(issuanceFees), // uint64 -> string
    verification_fees: u64ToStr(verificationFees), // uint64 -> string
  }),
  fromAmino: (value: {
    creator: string;
    schema_id: string;
    did: string;
    country: string;
    effective_from?: string;
    effective_until?: string;
    validation_fees: string;
    issuance_fees: string;
    verification_fees: string;
  }) =>
    MsgCreateRootPermission.fromPartial({
      creator: value.creator,
      schemaId: strToU64(value.schema_id), // string -> Long (uint64)
      did: value.did,
      country: value.country,
      effectiveFrom: isoToDate(value.effective_from), // ISO string -> Date (optional)
      effectiveUntil: isoToDate(value.effective_until), // ISO string -> Date (optional)
      validationFees: strToU64(value.validation_fees), // string -> Long (uint64)
      issuanceFees: strToU64(value.issuance_fees), // string -> Long (uint64)
      verificationFees: strToU64(value.verification_fees), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgExtendPermission
 */
export const MsgExtendPermissionAminoConverter = {
  aminoType: '/verana.perm.v1.MsgExtendPermission',
  toAmino: ({ creator, id, effectiveUntil }: MsgExtendPermission) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
    effective_until: dateToIsoAmino(effectiveUntil), // Date -> ISO string (optional)
  }),
  fromAmino: (value: { creator: string; id: string; effective_until?: string }) =>
    MsgExtendPermission.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
      effectiveUntil: isoToDate(value.effective_until), // ISO string -> Date (optional)
    }),
};

/**
 * Amino converter for MsgRevokePermission
 */
export const MsgRevokePermissionAminoConverter = {
  aminoType: '/verana.perm.v1.MsgRevokePermission',
  toAmino: ({ creator, id }: MsgRevokePermission) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
  }),
  fromAmino: (value: { creator: string; id: string }) =>
    MsgRevokePermission.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgCreateOrUpdatePermissionSession
 */
export const MsgCreateOrUpdatePermissionSessionAminoConverter = {
  aminoType: '/verana.perm.v1.MsgCreateOrUpdatePermissionSession',
  toAmino: ({
    creator,
    id,
    issuerPermId,
    verifierPermId,
    agentPermId,
    walletAgentPermId,
  }: MsgCreateOrUpdatePermissionSession) => ({
    creator,
    id, // UUID string
    issuer_perm_id: u64ToStr(issuerPermId), // uint64 -> string
    verifier_perm_id: u64ToStr(verifierPermId), // uint64 -> string
    agent_perm_id: u64ToStr(agentPermId), // uint64 -> string
    wallet_agent_perm_id: u64ToStr(walletAgentPermId), // uint64 -> string
  }),
  fromAmino: (value: {
    creator: string;
    id: string;
    issuer_perm_id: string;
    verifier_perm_id: string;
    agent_perm_id: string;
    wallet_agent_perm_id: string;
  }) =>
    MsgCreateOrUpdatePermissionSession.fromPartial({
      creator: value.creator,
      id: value.id,
      issuerPermId: strToU64(value.issuer_perm_id), // string -> Long (uint64)
      verifierPermId: strToU64(value.verifier_perm_id), // string -> Long (uint64)
      agentPermId: strToU64(value.agent_perm_id), // string -> Long (uint64)
      walletAgentPermId: strToU64(value.wallet_agent_perm_id), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgSlashPermissionTrustDeposit
 */
export const MsgSlashPermissionTrustDepositAminoConverter = {
  aminoType: '/verana.perm.v1.MsgSlashPermissionTrustDeposit',
  toAmino: ({ creator, id, amount }: MsgSlashPermissionTrustDeposit) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
    amount: u64ToStr(amount), // uint64 -> string
  }),
  fromAmino: (value: { creator: string; id: string; amount: string }) =>
    MsgSlashPermissionTrustDeposit.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
      amount: strToU64(value.amount), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgRepayPermissionSlashedTrustDeposit
 */
export const MsgRepayPermissionSlashedTrustDepositAminoConverter = {
  aminoType: '/verana.perm.v1.MsgRepayPermissionSlashedTrustDeposit',
  toAmino: ({ creator, id }: MsgRepayPermissionSlashedTrustDeposit) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
  }),
  fromAmino: (value: { creator: string; id: string }) =>
    MsgRepayPermissionSlashedTrustDeposit.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgCreatePermission
 */
export const MsgCreatePermissionAminoConverter = {
  aminoType: '/verana.perm.v1.MsgCreatePermission',
  toAmino: ({
    creator,
    schemaId,
    type,
    did,
    country,
    effectiveFrom,
    effectiveUntil,
    verificationFees,
    validationFees,
  }: MsgCreatePermission) => ({
    creator,
    schema_id: u64ToStr(schemaId), // uint64 -> string
    type,
    did,
    country,
    effective_from: dateToIsoAmino(effectiveFrom), // Date -> ISO string (optional)
    effective_until: dateToIsoAmino(effectiveUntil), // Date -> ISO string (optional)
    verification_fees: u64ToStr(verificationFees), // uint64 -> string
    validation_fees: u64ToStr(validationFees), // uint64 -> string
  }),
  fromAmino: (value: {
    creator: string;
    schema_id: string;
    type: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    did: string;
    country: string;
    effective_from?: string;
    effective_until?: string;
    verification_fees: string;
    validation_fees: string;
  }) =>
    MsgCreatePermission.fromPartial({
      creator: value.creator,
      schemaId: strToU64(value.schema_id), // string -> Long (uint64)
      type: value.type,
      did: value.did,
      country: value.country,
      effectiveFrom: isoToDate(value.effective_from), // ISO string -> Date (optional)
      effectiveUntil: isoToDate(value.effective_until), // ISO string -> Date (optional)
      verificationFees: strToU64(value.verification_fees), // string -> Long (uint64)
      validationFees: strToU64(value.validation_fees), // string -> Long (uint64)
    }),
};