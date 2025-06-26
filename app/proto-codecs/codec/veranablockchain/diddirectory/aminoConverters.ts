// src/app/proto-codecs/codec/veranablockchain/diddirectory/aminoConverters.ts
import type { AminoConverter } from '@cosmjs/stargate'
import { MsgAddDID } from './tx'

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
