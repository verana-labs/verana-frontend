// src/app/proto-codecs/codec/veranablockchain/diddirectory/aminoConverters.ts
import type { AminoConverter } from '@cosmjs/stargate'
import { MsgAddDID, MsgRenewDID, MsgTouchDID, MsgRemoveDID } from './tx'

/**
 * Amino converter for MsgAddDID
 */
export const MsgAddDIDAminoConverter: AminoConverter = {
  aminoType: '/veranablockchain.diddirectory.MsgAddDID',
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
  aminoType: '/veranablockchain.diddirectory.MsgRenewDID',
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
  aminoType: '/veranablockchain.diddirectory.MsgTouchDID',
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
  aminoType: '/veranablockchain.diddirectory.MsgRemoveDID',
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
