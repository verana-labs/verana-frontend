'use client';

import {
  MsgCreateTrustRegistry,
  MsgAddGovernanceFrameworkDocument,
  MsgIncreaseActiveGovernanceFrameworkVersion,
  MsgUpdateTrustRegistry,
  MsgArchiveTrustRegistry,
} from 'proto-codecs/codec/verana/tr/v1/tx'
import { strToU64, u64ToStr } from '@/msg/util/aminoHelpers';

/**
 * Amino converter for MsgCreateTrustRegistry
 */
export const MsgCreateTrustRegistryAminoConverter = {
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
};

/**
 * Amino converter for MsgAddGovernanceFrameworkDocument
 */
export const MsgAddGovernanceFrameworkDocumentAminoConverter = {
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
    id: u64ToStr(id), // uint64 -> string
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
      id: strToU64(value.id), // string -> Long (uint64)
      docLanguage: value.doc_language,
      docUrl: value.doc_url,
      docDigestSri: value.doc_digest_sri,
      version: value.version,
    }),
};

/**
 * Amino converter for MsgIncreaseActiveGovernanceFrameworkVersion
 */
export const MsgIncreaseActiveGovernanceFrameworkVersionAminoConverter = {
  aminoType: '/verana.tr.v1.MsgIncreaseActiveGovernanceFrameworkVersion',
  toAmino: ({ creator, id }: MsgIncreaseActiveGovernanceFrameworkVersion) => ({
    creator,
    id: u64ToStr(id) // uint64 -> string
  }),
  fromAmino: (value: { creator: string; id: string }) =>
    MsgIncreaseActiveGovernanceFrameworkVersion.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
    }),
};

/**
 * Amino converter for MsgUpdateTrustRegistry
 */
export const MsgUpdateTrustRegistryAminoConverter = {
  aminoType: '/verana.tr.v1.MsgUpdateTrustRegistry',
  toAmino: ({ creator, id, did, aka }: MsgUpdateTrustRegistry) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
    did,
    aka,
  }),
  fromAmino: (value: { creator: string; id: string; did: string; aka: string }) =>
    MsgUpdateTrustRegistry.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
      did: value.did,
      aka: value.aka,
    }),
};

/**
 * Amino converter for MsgArchiveTrustRegistry
 */
export const MsgArchiveTrustRegistryAminoConverter = {
  aminoType: '/verana.tr.v1.MsgArchiveTrustRegistry',
  toAmino: ({ creator, id, archive }: MsgArchiveTrustRegistry) => ({
    creator,
    id: u64ToStr(id), // uint64 -> string
    archive,
  }),
  fromAmino: (value: { creator: string; id: string; archive: boolean }) =>
    MsgArchiveTrustRegistry.fromPartial({
      creator: value.creator,
      id: strToU64(value.id), // string -> Long (uint64)
      archive: value.archive,
    }),
};