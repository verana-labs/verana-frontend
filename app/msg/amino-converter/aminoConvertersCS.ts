'use client';

import {
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from '@/proto-codecs/codec/verana/cs/v1/tx';
import { u64ToStr, strToU64, toUInt32, u32ToAmino, fromAminoU32 } from '@/app/util/aminoHelpers';

/**
 * Amino converter for MsgCreateCredentialSchema
 */
export const MsgCreateCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgCreateCredentialSchema',
  // Proto → Amino JSON
  toAmino: (m: MsgCreateCredentialSchema) => ({
    creator: m.creator ?? '',
    tr_id: u64ToStr(m.trId), // uint64 -> string
    json_schema: m.jsonSchema ?? '',
    issuer_grantor_validation_validity_period: toUInt32(m.issuerGrantorValidationValidityPeriod) ?? 0, // uint32 -> number
    verifier_grantor_validation_validity_period: toUInt32(m.verifierGrantorValidationValidityPeriod) ?? 0, // uint32 -> number
    issuer_validation_validity_period: toUInt32(m.issuerValidationValidityPeriod) ?? 0, // uint32 -> number
    verifier_validation_validity_period: toUInt32(m.verifierValidationValidityPeriod) ?? 0, // uint32 -> number
    holder_validation_validity_period: toUInt32(m.holderValidationValidityPeriod) ?? 0, // uint32 -> number
    issuer_perm_management_mode: toUInt32(m.issuerPermManagementMode) ?? 0, // uint32 -> number
    verifier_perm_management_mode: toUInt32(m.verifierPermManagementMode) ?? 0, // uint32 -> number
  }),
  // Amino JSON → Proto
  fromAmino: (a: {
    creator: string;
    tr_id?: string; // uint64
    json_schema: string;
    issuer_grantor_validation_validity_period: number; // uint32
    verifier_grantor_validation_validity_period: number; // uint32
    issuer_validation_validity_period: number; // uint32
    verifier_validation_validity_period: number; // uint32
    holder_validation_validity_period: number; // uint32
    issuer_perm_management_mode: number; // enum/int32
    verifier_perm_management_mode: number; // enum/int32
  }): MsgCreateCredentialSchema =>
    MsgCreateCredentialSchema.fromPartial({
      creator: a.creator ?? '',
      trId: strToU64(a.tr_id),
      jsonSchema: a.json_schema ?? '',
      issuerGrantorValidationValidityPeriod: toUInt32(a.issuer_grantor_validation_validity_period) ?? 0,
      verifierGrantorValidationValidityPeriod: toUInt32(a.verifier_grantor_validation_validity_period) ?? 0,
      issuerValidationValidityPeriod: toUInt32(a.issuer_validation_validity_period) ?? 0,
      verifierValidationValidityPeriod: toUInt32(a.verifier_validation_validity_period) ?? 0,
      holderValidationValidityPeriod: toUInt32(a.holder_validation_validity_period) ?? 0,
      issuerPermManagementMode: toUInt32(a.issuer_perm_management_mode) ?? 0,
      verifierPermManagementMode: toUInt32(a.verifier_perm_management_mode) ?? 0,
    }),
};

/**
 * Amino converter for MsgUpdateCredentialSchema
 */
export const MsgUpdateCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgUpdateCredentialSchema',
  toAmino: (m: MsgUpdateCredentialSchema) => ({
    creator: m.creator ?? '',
    id: u64ToStr(m.id), // uint64 -> string
    issuer_grantor_validation_validity_period: u32ToAmino(m.issuerGrantorValidationValidityPeriod),
    verifier_grantor_validation_validity_period: u32ToAmino(m.verifierGrantorValidationValidityPeriod),
    issuer_validation_validity_period: u32ToAmino(m.issuerValidationValidityPeriod),
    verifier_validation_validity_period: u32ToAmino(m.verifierValidationValidityPeriod),
    holder_validation_validity_period: u32ToAmino(m.holderValidationValidityPeriod),
  }),
  fromAmino: (a: any) => MsgUpdateCredentialSchema.fromPartial({ // eslint-disable-line @typescript-eslint/no-explicit-any
    creator: a.creator ?? '',
    id: strToU64(a.id),
    issuerGrantorValidationValidityPeriod: fromAminoU32(a.issuer_grantor_validation_validity_period),
    verifierGrantorValidationValidityPeriod: fromAminoU32(a.verifier_grantor_validation_validity_period),
    issuerValidationValidityPeriod: fromAminoU32(a.issuer_validation_validity_period),
    verifierValidationValidityPeriod: fromAminoU32(a.verifier_validation_validity_period),
    holderValidationValidityPeriod: fromAminoU32(a.holder_validation_validity_period),
  }),
};

/**
 * Amino converter for MsgArchiveCredentialSchema
 */
export const MsgArchiveCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgArchiveCredentialSchema',
  // Proto → Amino JSON
  toAmino: (m: MsgArchiveCredentialSchema) => ({
    creator: m.creator ?? '',
    id: u64ToStr(m.id),
    archive: m.archive ?? false,
  }),
  // Amino JSON → Proto
  fromAmino: (a: { creator: string; id: string; archive: boolean }): MsgArchiveCredentialSchema =>
    MsgArchiveCredentialSchema.fromPartial({
      creator: a.creator,
      id: strToU64(a.id),
      archive: a.archive ?? false,
    }),
};