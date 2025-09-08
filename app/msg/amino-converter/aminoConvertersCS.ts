'use client';

import {
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from '@/proto-codecs/codec/verana/cs/v1/tx';
import Long from 'long';

/**
 * Amino converter for MsgCreateCredentialSchema
 */
export const MsgCreateCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgCreateCredentialSchema',
  // Proto → Amino JSON
  toAmino: (m: MsgCreateCredentialSchema) => ({
    creator: m.creator ?? '',
    tr_id: m.trId != null ? m.trId.toString() : undefined, // uint64 -> string
    json_schema: m.jsonSchema ?? '',
    issuer_grantor_validation_validity_period: m.issuerGrantorValidationValidityPeriod ?? undefined, // uint32 -> number
    verifier_grantor_validation_validity_period: m.verifierGrantorValidationValidityPeriod ?? undefined, // uint32 -> number
    issuer_validation_validity_period: m.issuerValidationValidityPeriod ?? undefined, // uint32 -> number
    verifier_validation_validity_period: m.verifierValidationValidityPeriod ?? undefined, // uint32 -> number
    holder_validation_validity_period: m.holderValidationValidityPeriod ?? undefined, // uint32 -> number
    issuer_perm_management_mode: m.issuerPermManagementMode ?? undefined,
    verifier_perm_management_mode: m.verifierPermManagementMode ?? undefined,
  }),
  // Amino JSON → Proto
  fromAmino: (a: {
    creator: string;
    tr_id?: string; // stringified uint64
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
      creator: a.creator,
      trId: a.tr_id != null ? Long.fromString(a.tr_id) : undefined,       // Be explicit: string → Long
      jsonSchema: a.json_schema,
      issuerGrantorValidationValidityPeriod: a.issuer_grantor_validation_validity_period, // number (uint32)
      verifierGrantorValidationValidityPeriod: a.verifier_grantor_validation_validity_period,
      issuerValidationValidityPeriod: a.issuer_validation_validity_period,
      verifierValidationValidityPeriod: a.verifier_validation_validity_period,
      holderValidationValidityPeriod: a.holder_validation_validity_period,
      issuerPermManagementMode: a.issuer_perm_management_mode,
      verifierPermManagementMode: a.verifier_perm_management_mode,
    }),
};

/**
 * Amino converter for MsgUpdateCredentialSchema
 */
export const MsgUpdateCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgUpdateCredentialSchema',
  toAmino: (m: MsgUpdateCredentialSchema) => ({
    creator: m.creator,
    id: m.id != null ? m.id.toString() : undefined, // uint64 -> string
    issuer_grantor_validation_validity_period: m.issuerGrantorValidationValidityPeriod ?? undefined, // uint32 -> number
    verifier_grantor_validation_validity_period: m.verifierGrantorValidationValidityPeriod ?? undefined, // uint32 -> number
    issuer_validation_validity_period: m.issuerValidationValidityPeriod ?? undefined, // uint32 -> number
    verifier_validation_validity_period: m.verifierValidationValidityPeriod ?? undefined, // uint32 -> number
    holder_validation_validity_period: m.holderValidationValidityPeriod ?? undefined, // uint32 -> number
  }),
  fromAmino: (a: {
    creator: string;
    id?: string;
    issuer_grantor_validation_validity_period?: number;
    verifier_grantor_validation_validity_period?: number;
    issuer_validation_validity_period?: number;
    verifier_validation_validity_period?: number;
    holder_validation_validity_period?: number;
  }): MsgUpdateCredentialSchema =>
    MsgUpdateCredentialSchema.fromPartial({
      creator: a.creator,
      id: a.id != null ? Long.fromString(a.id) : undefined, // string -> Long (uint64)
      issuerGrantorValidationValidityPeriod: a.issuer_grantor_validation_validity_period, // number (uint32)
      verifierGrantorValidationValidityPeriod: a.verifier_grantor_validation_validity_period,
      issuerValidationValidityPeriod: a.issuer_validation_validity_period,
      verifierValidationValidityPeriod: a.verifier_validation_validity_period,
      holderValidationValidityPeriod: a.holder_validation_validity_period,
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
    id: m.id != null ? m.id.toString() : undefined, // uint64 MUST be string in Amino JSON
    archive: m.archive ?? false,
  }),
  // Amino JSON → Proto
  fromAmino: (a: { creator: string; id: string; archive: boolean }): MsgArchiveCredentialSchema =>
    MsgArchiveCredentialSchema.fromPartial({
      creator: a.creator,
      id: a.id != null ? Long.fromString(a.id) : undefined, // Be explicit: string → Long
      archive: a.archive,
    }),
};