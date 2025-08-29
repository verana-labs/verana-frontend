'use client';

import { AminoTypes, type AminoConverter } from '@cosmjs/stargate';
import {
  MsgUpdateParams,
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
  MsgArchiveCredentialSchema,
} from '@/proto-codecs/codec/verana/cs/v1/tx';
import { Params } from '@/proto-codecs/codec/verana/cs/v1/params';

/**
 * Amino converter for MsgUpdateParams
 */
export const MsgUpdateParamsCSAminoConverter: AminoConverter = {
  aminoType: '/verana.cs.v1.MsgUpdateParams',
  toAmino: ({ authority, params }: MsgUpdateParams) => ({
    authority,
    params, // ajusta aquí si 'params' requiere transformación especial
  }),
  fromAmino: (value: { authority: string; params: Params }) =>
    MsgUpdateParams.fromPartial({
      authority: value.authority,
      params: value.params,
    }),
};

/**
 * Amino converter for MsgCreateCredentialSchema
 */
export const MsgCreateCredentialSchemaAminoConverter: AminoConverter = {
  aminoType: '/verana.cs.v1.MsgCreateCredentialSchema',
  toAmino: ({
    creator,
    trId,
    jsonSchema,
    issuerGrantorValidationValidityPeriod,
    verifierGrantorValidationValidityPeriod,
    issuerValidationValidityPeriod,
    verifierValidationValidityPeriod,
    holderValidationValidityPeriod,
    issuerPermManagementMode,
    verifierPermManagementMode,
  }: MsgCreateCredentialSchema) => ({
    creator,
    tr_id: trId, // uint64 como string en Amino
    json_schema: jsonSchema,
    issuer_grantor_validation_validity_period: issuerGrantorValidationValidityPeriod,
    verifier_grantor_validation_validity_period: verifierGrantorValidationValidityPeriod,
    issuer_validation_validity_period: issuerValidationValidityPeriod,
    verifier_validation_validity_period: verifierValidationValidityPeriod,
    holder_validation_validity_period: holderValidationValidityPeriod,
    issuer_perm_management_mode: issuerPermManagementMode,
    verifier_perm_management_mode: verifierPermManagementMode,
  }),
  fromAmino: (value: {
    creator: string;
    tr_id: string;
    json_schema: string;
    issuer_grantor_validation_validity_period: number;
    verifier_grantor_validation_validity_period: number;
    issuer_validation_validity_period: number;
    verifier_validation_validity_period: number;
    holder_validation_validity_period: number;
    issuer_perm_management_mode: number;
    verifier_perm_management_mode: number;
  }) =>
    MsgCreateCredentialSchema.fromPartial({
      creator: value.creator,
      trId: value.tr_id, // el generated hará Long.fromValue(...)
      jsonSchema: value.json_schema,
      issuerGrantorValidationValidityPeriod: value.issuer_grantor_validation_validity_period,
      verifierGrantorValidationValidityPeriod: value.verifier_grantor_validation_validity_period,
      issuerValidationValidityPeriod: value.issuer_validation_validity_period,
      verifierValidationValidityPeriod: value.verifier_validation_validity_period,
      holderValidationValidityPeriod: value.holder_validation_validity_period,
      issuerPermManagementMode: value.issuer_perm_management_mode,
      verifierPermManagementMode: value.verifier_perm_management_mode,
    }),
};

/**
 * Amino converter for MsgUpdateCredentialSchema
 */
export const MsgUpdateCredentialSchemaAminoConverter: AminoConverter = {
  aminoType: '/verana.cs.v1.MsgUpdateCredentialSchema',
  toAmino: ({
    creator,
    id,
    issuerGrantorValidationValidityPeriod,
    verifierGrantorValidationValidityPeriod,
    issuerValidationValidityPeriod,
    verifierValidationValidityPeriod,
    holderValidationValidityPeriod,
  }: MsgUpdateCredentialSchema) => ({
    creator,
    id: id, // uint64 como string en Amino
    issuer_grantor_validation_validity_period: issuerGrantorValidationValidityPeriod,
    verifier_grantor_validation_validity_period: verifierGrantorValidationValidityPeriod,
    issuer_validation_validity_period: issuerValidationValidityPeriod,
    verifier_validation_validity_period: verifierValidationValidityPeriod,
    holder_validation_validity_period: holderValidationValidityPeriod,
  }),
  fromAmino: (value: {
    creator: string;
    id: string;
    issuer_grantor_validation_validity_period: number;
    verifier_grantor_validation_validity_period: number;
    issuer_validation_validity_period: number;
    verifier_validation_validity_period: number;
    holder_validation_validity_period: number;
  }) =>
    MsgUpdateCredentialSchema.fromPartial({
      creator: value.creator,
      id: value.id, // Long.fromValue interno
      issuerGrantorValidationValidityPeriod: value.issuer_grantor_validation_validity_period,
      verifierGrantorValidationValidityPeriod: value.verifier_grantor_validation_validity_period,
      issuerValidationValidityPeriod: value.issuer_validation_validity_period,
      verifierValidationValidityPeriod: value.verifier_validation_validity_period,
      holderValidationValidityPeriod: value.holder_validation_validity_period,
    }),
};

/**
 * Amino converter for MsgArchiveCredentialSchema
 */
export const MsgArchiveCredentialSchemaAminoConverter: AminoConverter = {
  aminoType: '/verana.cs.v1.MsgArchiveCredentialSchema',
  toAmino: ({ creator, id, archive }: MsgArchiveCredentialSchema) => ({
    creator,
    id: id, // uint64 como string en Amino
    archive,
  }),
  fromAmino: (value: { creator: string; id: string; archive: boolean }) =>
    MsgArchiveCredentialSchema.fromPartial({
      creator: value.creator,
      id: value.id, // Long.fromValue interno
      archive: value.archive,
    }),
};

export const veranaCsAminoConverters = new AminoTypes({
  '/verana.cs.v1.MsgUpdateParams': MsgUpdateParamsCSAminoConverter,
  '/verana.cs.v1.MsgCreateCredentialSchema': MsgCreateCredentialSchemaAminoConverter,
  '/verana.cs.v1.MsgUpdateCredentialSchema': MsgUpdateCredentialSchemaAminoConverter,
  '/verana.cs.v1.MsgArchiveCredentialSchema': MsgArchiveCredentialSchemaAminoConverter,
});