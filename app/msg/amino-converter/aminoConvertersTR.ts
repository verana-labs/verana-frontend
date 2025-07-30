import { AminoTypes, type AminoConverter } from '@cosmjs/stargate'
import {
  MsgUpdateParams,
  MsgCreateTrustRegistry,
  MsgAddGovernanceFrameworkDocument,
  MsgIncreaseActiveGovernanceFrameworkVersion,
  MsgUpdateTrustRegistry,
  MsgArchiveTrustRegistry,
} from '@/proto-codecs/codec/verana/tr/v1/tx'
import { Params } from '@/proto-codecs/codec/verana/tr/v1/params';

/**
 * Amino converter for MsgUpdateParams
 */
export const MsgUpdateParamsAminoConverter: AminoConverter = {
  aminoType: '/verana.tr.v1.MsgUpdateParams',
  toAmino: ({ authority, params }: MsgUpdateParams) => ({
    authority,
    params, // Ajusta si 'params' requiere transformación especial
  }),
  fromAmino: (value: { authority: string; params: Params }) =>
    MsgUpdateParams.fromPartial({
      authority: value.authority,
      params: value.params,
    }),
}

/**
 * Amino converter for MsgCreateTrustRegistry
 */
export const MsgCreateTrustRegistryAminoConverter: AminoConverter = {
  aminoType: '/verana.tr.v1.MsgCreateTrustRegistry',
  toAmino: ({
    creator,
    did,
    aka,
    language,
    docUrl,
    docDigestSri,
  }: MsgCreateTrustRegistry) => ({
    creator,
    did,
    aka,
    language,
    doc_url: docUrl,
    doc_digest_sri: docDigestSri,
  }),
  fromAmino: (value: {
    creator: string;
    did: string;
    aka: string;
    language: string;
    doc_url: string;
    doc_digest_sri: string;
  }) =>
    MsgCreateTrustRegistry.fromPartial({
      creator: value.creator,
      did: value.did,
      aka: value.aka,
      language: value.language,
      docUrl: value.doc_url,
      docDigestSri: value.doc_digest_sri,
    }),
}

/**
 * Amino converter for MsgAddGovernanceFrameworkDocument
 */
export const MsgAddGovernanceFrameworkDocumentAminoConverter: AminoConverter = {
  aminoType: '/verana.tr.v1.MsgAddGovernanceFrameworkDocument',
  toAmino: ({
    creator,
    id,
    docLanguage,
    docUrl,
    docDigestSri,
    version,
  }: MsgAddGovernanceFrameworkDocument) => ({
    creator,
    id: id,
    doc_language: docLanguage,
    doc_url: docUrl,
    doc_digest_sri: docDigestSri,
    version,
  }),
  fromAmino: (value: {
    creator: string;
    id: string;
    doc_language: string;
    doc_url: string;
    doc_digest_sri: string;
    version: number;
  }) =>
    MsgAddGovernanceFrameworkDocument.fromPartial({
      creator: value.creator,
      id: value.id,
      docLanguage: value.doc_language,
      docUrl: value.doc_url,
      docDigestSri: value.doc_digest_sri,
      version: value.version,
    }),
}

/**
 * Amino converter for MsgIncreaseActiveGovernanceFrameworkVersion
 */
export const MsgIncreaseActiveGovernanceFrameworkVersionAminoConverter: AminoConverter = {
  aminoType: '/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion',
  toAmino: ({ creator, id }: MsgIncreaseActiveGovernanceFrameworkVersion) => ({
    creator,
    id: id,
  }),
  fromAmino: (value: { creator: string; id: string }) =>
    MsgIncreaseActiveGovernanceFrameworkVersion.fromPartial({
      creator: value.creator,
      id: value.id,
    }),
}

/**
 * Amino converter for MsgUpdateTrustRegistry
 */
export const MsgUpdateTrustRegistryAminoConverter: AminoConverter = {
  aminoType: '/verana.tr.v1.MsgUpdateTrustRegistry',
  toAmino: ({ creator, id, did, aka }: MsgUpdateTrustRegistry) => ({
    creator,
    id: id,
    did,
    aka,
  }),
  fromAmino: (value: { creator: string; id: string; did: string; aka: string }) =>
    MsgUpdateTrustRegistry.fromPartial({
      creator: value.creator,
      id: value.id,
      did: value.did,
      aka: value.aka,
    }),
}

/**
 * Amino converter for MsgArchiveTrustRegistry
 */
export const MsgArchiveTrustRegistryAminoConverter: AminoConverter = {
  aminoType: '/verana.tr.v1.MsgArchiveTrustRegistry',
  toAmino: ({ creator, id, archive }: MsgArchiveTrustRegistry) => ({
    creator,
    id: id,
    archive,
  }),
  fromAmino: (value: { creator: string; id: string; archive: boolean }) =>
    MsgArchiveTrustRegistry.fromPartial({
      creator: value.creator,
      id: value.id,
      archive: value.archive,
    }),
}

export const veranaTrAminoConverters = new AminoTypes ({
  '/verana.tr.v1.MsgUpdateParams': MsgUpdateParamsAminoConverter,
  '/verana.tr.v1.MsgCreateTrustRegistry': MsgCreateTrustRegistryAminoConverter,
  '/verana.tr.v1.MsgAddGovernanceFrameworkDocument': MsgAddGovernanceFrameworkDocumentAminoConverter,
  '/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion': MsgIncreaseActiveGovernanceFrameworkVersionAminoConverter,
  '/verana.tr.v1.MsgUpdateTrustRegistry': MsgUpdateTrustRegistryAminoConverter,
  '/verana.tr.v1.MsgArchiveTrustRegistry': MsgArchiveTrustRegistryAminoConverter,
});
