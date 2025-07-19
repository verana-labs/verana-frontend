import type { AminoConverter } from '@cosmjs/stargate'
import { MsgReclaimTrustDeposit, MsgReclaimTrustDepositInterests } from '@/proto-codecs/codec/veranablockchain/trustdeposit/tx'

/**
 * Amino converter for MsgReclaimTrustDeposit
 */
export const MsgReclaimTrustDepositAminoConverter: AminoConverter = {
  aminoType: '/verana.td.v1.MsgReclaimTrustDeposit',
  toAmino: ({ creator, claimed }: MsgReclaimTrustDeposit) => ({
    creator,
    claimed
  }),
  fromAmino: (value: { creator: string; claimed: number }) =>
    MsgReclaimTrustDeposit.fromPartial({
      creator: value.creator,
      claimed: value.claimed
    }),
}

/**
 * Amino converter for MsgReclaimTrustDepositInterests
 */
export const MsgReclaimTrustDepositInterestsAminoConverter: AminoConverter = {
  aminoType: '/verana.td.v1.MsgReclaimTrustDepositInterests',
  toAmino: ({ creator }: MsgReclaimTrustDepositInterests) => ({
    creator
  }),
  fromAmino: (value: { creator: string }) =>
    MsgReclaimTrustDepositInterests.fromPartial({
      creator: value.creator
    }),
}

