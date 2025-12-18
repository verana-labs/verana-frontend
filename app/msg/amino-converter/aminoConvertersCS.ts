'use client';

/* eslint-disable */
import {
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from 'proto-codecs/codec/verana/cs/v1/tx';
import { u64ToStr, strToU64, u32ToAmino, fromOptU32Amino, toOptU32Amino } from '@/util/aminoHelpers';
import Long from "long";

/**
 * Amino converter for MsgCreateCredentialSchema
 */
export const MsgCreateCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgCreateCredentialSchema',
  // Proto → Amino JSON
  toAmino: (m: MsgCreateCredentialSchema) => clean({
    creator: m.creator ?? '',
    tr_id: u64ToStr(m.trId), // uint64 -> string
    json_schema: m.jsonSchema ?? '',
    issuer_grantor_validation_validity_period: toOptU32Amino(m.issuerGrantorValidationValidityPeriod),
    verifier_grantor_validation_validity_period: toOptU32Amino(m.verifierGrantorValidationValidityPeriod),
    issuer_validation_validity_period: toOptU32Amino(m.issuerValidationValidityPeriod),
    verifier_validation_validity_period: toOptU32Amino(m.verifierValidationValidityPeriod),
    holder_validation_validity_period: toOptU32Amino(m.holderValidationValidityPeriod),
    issuer_perm_management_mode: u32ToAmino(m.issuerPermManagementMode) , // uint32 -> number
    verifier_perm_management_mode: u32ToAmino(m.verifierPermManagementMode) , // uint32 -> number
  }),
  // Amino JSON → Proto
  fromAmino: (a: any ): MsgCreateCredentialSchema =>
    MsgCreateCredentialSchema.fromPartial({
      creator: a.creator ?? '',
      trId: strToU64(a.tr_id),
      jsonSchema: a.json_schema ?? '',
      issuerGrantorValidationValidityPeriod: fromOptU32Amino(a.issuer_grantor_validation_validity_period),
      verifierGrantorValidationValidityPeriod: fromOptU32Amino(a.verifier_grantor_validation_validity_period),
      issuerValidationValidityPeriod: fromOptU32Amino(a.issuer_validation_validity_period),
      verifierValidationValidityPeriod: fromOptU32Amino(a.verifier_validation_validity_period),
      holderValidationValidityPeriod: fromOptU32Amino(a.holder_validation_validity_period),
      issuerPermManagementMode: (a.issuer_perm_management_mode) ,
      verifierPermManagementMode: (a.verifier_perm_management_mode) ,
    }),
};

/**
 * Amino converter for MsgUpdateCredentialSchema
 */
export const MsgUpdateCredentialSchemaAminoConverter = {
  aminoType: '/verana.cs.v1.MsgUpdateCredentialSchema',
  toAmino: (m: MsgUpdateCredentialSchema) => clean({
    creator: m.creator ?? '',
    id: u64ToStr(m.id),
    issuer_grantor_validation_validity_period: toOptU32Amino(m.issuerGrantorValidationValidityPeriod),
    verifier_grantor_validation_validity_period: toOptU32Amino(m.verifierGrantorValidationValidityPeriod),
    issuer_validation_validity_period: toOptU32Amino(m.issuerValidationValidityPeriod),
    verifier_validation_validity_period: toOptU32Amino(m.verifierValidationValidityPeriod),
    holder_validation_validity_period: toOptU32Amino(m.holderValidationValidityPeriod),


  }),
  fromAmino: (a: any) => MsgUpdateCredentialSchema.fromPartial({
    creator: a.creator ?? '',
    id: strToU64(a.id),
    issuerGrantorValidationValidityPeriod: fromOptU32Amino(a.issuer_grantor_validation_validity_period),
    verifierGrantorValidationValidityPeriod: fromOptU32Amino(a.verifier_grantor_validation_validity_period),
    issuerValidationValidityPeriod: fromOptU32Amino(a.issuer_validation_validity_period),
    verifierValidationValidityPeriod: fromOptU32Amino(a.verifier_validation_validity_period),
    holderValidationValidityPeriod: fromOptU32Amino(a.holder_validation_validity_period),
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

const clean = <T extends Record<string, any>>(o: T): T => {
  Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]);
  return o;
};
