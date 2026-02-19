'use client';

import { AminoConverter, AminoTypes } from '@cosmjs/stargate'
import { MsgAddDID, MsgRenewDID, MsgTouchDID, MsgRemoveDID } from 'proto-codecs/codec/verana/dd/v1/tx'

/**
 * Amino converter for MsgAddDID
 */
export const MsgAddDIDAminoConverter: AminoConverter = {
  aminoType: '/verana.dd.v1.MsgAddDID',
  toAmino: ({ creator, did, years }: MsgAddDID) => ({
    creator,
    did,
    years,
  }),
  fromAmino: (value: { creator: string; did: string; years: number }) =>
    MsgAddDID.fromPartial({
      creator: value.creator,
      did: value.did,
      years: value.years,
    }),
}

/**
 * Amino converter for MsgRenewDID
 */
export const MsgRenewDIDAminoConverter: AminoConverter = {
  aminoType: '/verana.dd.v1.MsgRenewDID',
  toAmino: ({ creator, did, years }: MsgRenewDID) => ({
    creator,
    did,
    years,
  }),
  fromAmino: (value: { creator: string; did: string; years: number }) =>
    MsgRenewDID.fromPartial({
      creator: value.creator,
      did: value.did,
      years: value.years,
    }),
}

/**
 * Amino converter for MsgTouchDID
 */
export const MsgTouchDIDAminoConverter: AminoConverter = {
  aminoType: '/verana.dd.v1.MsgTouchDID',
  toAmino: ({ creator, did }: MsgTouchDID) => ({
    creator,
    did,
  }),
  fromAmino: (value: { creator: string; did: string }) =>
    MsgTouchDID.fromPartial({
      creator: value.creator,
      did: value.did,
    }),
}

/**
 * Amino converter for MsgRemoveDID
 */
export const MsgRemoveDIDAminoConverter: AminoConverter = {
  aminoType: '/verana.dd.v1.MsgRemoveDID',
  toAmino: ({ creator, did }: MsgRemoveDID) => ({
    creator,
    did,
  }),
  fromAmino: (value: { creator: string; did: string }) =>
    MsgRemoveDID.fromPartial({
      creator: value.creator,
      did: value.did,
    }),
}

export const veranaDIDAminoConverters = new AminoTypes ({
  '/verana.dd.v1.MsgAddDID': MsgAddDIDAminoConverter,
  '/verana.dd.v1.MsgRenewDID': MsgRenewDIDAminoConverter,
  '/verana.dd.v1.MsgTouchDID': MsgTouchDIDAminoConverter,
  '/verana.dd.v1.MsgRemoveDID': MsgRemoveDIDAminoConverter
});

// Supported Cosmos Amino message types for DID actions
export type MsgAny =
  | { typeUrl: '/verana.dd.v1.MsgAddDID'; value: MsgAddDID }
  | { typeUrl: '/verana.dd.v1.MsgRenewDID'; value: MsgRenewDID }
  | { typeUrl: '/verana.dd.v1.MsgTouchDID'; value: MsgTouchDID }
  | { typeUrl: '/verana.dd.v1.MsgRemoveDID'; value: MsgRemoveDID };
