import { AminoTypes, type AminoConverter } from '@cosmjs/stargate'
import {
  MsgUpdateParams,
  MsgReclaimTrustDepositYield,
  MsgReclaimTrustDeposit,
  MsgRepaySlashedTrustDeposit,
} from '@/proto-codecs/codec/verana/td/v1/tx'
import { Params } from "@/proto-codecs/codec/verana/td/v1//params";
    
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
 * Amino converter for MsgUpdateParams
 */
export const MsgUpdateParamsAminoConverter: AminoConverter = {
  aminoType: '/verana.td.v1.MsgUpdateParams',
  toAmino: ({ authority, params }: MsgUpdateParams) => ({
    authority,
    params,
  }),
  fromAmino: (value: { authority: string; params: Params }) =>
    MsgUpdateParams.fromPartial({
      authority: value.authority,
      params: value.params,
    }),
}

/**
 * Amino converter for MsgReclaimTrustDepositYield
 */
export const MsgReclaimTrustDepositYieldAminoConverter: AminoConverter = {
  aminoType: '/verana.td.v1.MsgReclaimTrustDepositYield',
  toAmino: ({ creator }: MsgReclaimTrustDepositYield) => ({
    creator,
  }),
  fromAmino: (value: { creator: string }) =>
    MsgReclaimTrustDepositYield.fromPartial({
      creator: value.creator,
    }),
}

/**
 * Amino converter for MsgRepaySlashedTrustDeposit
 */
export const MsgRepaySlashedTrustDepositAminoConverter: AminoConverter = {
  aminoType: '/verana.td.v1.MsgRepaySlashedTrustDeposit',
  toAmino: ({ creator, account, amount }: MsgRepaySlashedTrustDeposit) => ({
    creator,
    account,
    amount
  }),
  fromAmino: (value: { creator: string; account: string; amount: string }) =>
    MsgRepaySlashedTrustDeposit.fromPartial({
      creator: value.creator,
      account: value.account,
      amount: value.amount,
    }),
}

export const veranaTdAminoConverters = new AminoTypes ({
  '/verana.td.v1.MsgUpdateParams': MsgUpdateParamsAminoConverter,
  '/verana.td.v1.MsgReclaimTrustDepositYield': MsgReclaimTrustDepositYieldAminoConverter,
  '/verana.td.v1.MsgReclaimTrustDeposit': MsgReclaimTrustDepositAminoConverter,
  '/verana.td.v1.MsgRepaySlashedTrustDeposit': MsgRepaySlashedTrustDepositAminoConverter,
});



