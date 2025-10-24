'use client';

import { type AminoConverter } from '@cosmjs/stargate'
import {
  MsgReclaimTrustDepositYield,
  MsgReclaimTrustDeposit,
  MsgRepaySlashedTrustDeposit,
} from 'proto-codecs/codec/verana/td/v1/tx'
import Long from 'long';
    
/**
 * Amino converter for MsgReclaimTrustDeposit
 */
export const MsgReclaimTrustDepositAminoConverter = {
  aminoType: '/verana.td.v1.MsgReclaimTrustDeposit',
  toAmino: ({ creator, claimed }: MsgReclaimTrustDeposit) => ({
    creator,
    claimed: claimed != null ? claimed.toString() : undefined // uint64 -> string
  }),
  fromAmino: (value: { creator: string; claimed: number }) =>      
    MsgReclaimTrustDeposit.fromPartial({
      creator: value.creator,
      claimed: value.claimed != null ? Long.fromString(value.claimed.toString()) : undefined // string -> Long (uint64)
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
    amount: amount != null ? amount.toString() : undefined // uint64 -> string
  }),
  fromAmino: (value: { creator: string; account: string; amount: string }) =>
    MsgRepaySlashedTrustDeposit.fromPartial({
      creator: value.creator,
      account: value.account,
      amount: value.amount != null ? Long.fromString(value.amount) : undefined // string -> Long (uint64)
    }),
}



