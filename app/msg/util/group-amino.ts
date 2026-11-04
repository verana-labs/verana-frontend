import type { AminoMsg } from '@cosmjs/amino'
import type { EncodeObject, Registry } from '@cosmjs/proto-signing'
import { type AminoConverters, AminoTypes } from '@cosmjs/stargate'
import { clean, MsgCreateCorporationAminoConverter } from '@verana-labs/verana-types'
import { createGroupAminoConverters } from '@verana-labs/verana-types/amino-converter/group'
import {
  MsgExec,
  MsgUpdateGroupMembers,
  MsgUpdateGroupPolicyDecisionPolicy,
  MsgWithdrawProposal,
} from 'cosmjs-types/cosmos/group/v1/tx'
import type { MemberRequest } from 'cosmjs-types/cosmos/group/v1/types'

type AminoMemberRequest = { address?: string; weight?: string; metadata?: string }

const groupAminoConverters: AminoConverters = {
  '/cosmos.group.v1.MsgUpdateGroupMembers': {
    aminoType: 'cosmos-sdk/MsgUpdateGroupMembers',
    toAmino: (message: MsgUpdateGroupMembers) =>
      clean({
        admin: message.admin || undefined,
        group_id: String(message.groupId),
        member_updates: message.memberUpdates.map((member: MemberRequest) =>
          clean({
            address: member.address || undefined,
            weight: member.weight || undefined,
            metadata: member.metadata || undefined,
          })
        ),
      }),
    fromAmino: (value: { admin?: string; group_id: string; member_updates: AminoMemberRequest[] }) =>
      MsgUpdateGroupMembers.fromPartial({
        admin: value.admin ?? '',
        groupId: BigInt(value.group_id),
        memberUpdates: value.member_updates.map((member) => ({
          address: member.address ?? '',
          weight: member.weight ?? '',
          metadata: member.metadata ?? '',
        })),
      }),
  },
  '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy': {
    aminoType: 'cosmos-sdk/MsgUpdateGroupDecisionPolicy',
    toAmino: (message: MsgUpdateGroupPolicyDecisionPolicy) =>
      clean({
        admin: message.admin || undefined,
        group_policy_address: message.groupPolicyAddress || undefined,
        decision_policy: MsgCreateCorporationAminoConverter.toAmino({ decisionPolicy: message.decisionPolicy })
          .decision_policy,
      }),
    fromAmino: (value: { admin?: string; group_policy_address?: string; decision_policy: unknown }) =>
      MsgUpdateGroupPolicyDecisionPolicy.fromPartial({
        admin: value.admin ?? '',
        groupPolicyAddress: value.group_policy_address ?? '',
        decisionPolicy: MsgCreateCorporationAminoConverter.fromAmino({ decision_policy: value.decision_policy })
          .decisionPolicy,
      }),
  },
  '/cosmos.group.v1.MsgExec': {
    aminoType: 'cosmos-sdk/group/MsgExec',
    toAmino: (message: MsgExec) =>
      clean({ proposal_id: String(message.proposalId), executor: message.executor || undefined }),
    fromAmino: (value: { proposal_id: string; executor?: string }) =>
      MsgExec.fromPartial({ proposalId: BigInt(value.proposal_id), executor: value.executor ?? '' }),
  },
  '/cosmos.group.v1.MsgWithdrawProposal': {
    aminoType: 'cosmos-sdk/group/MsgWithdrawProposal',
    toAmino: (message: MsgWithdrawProposal) =>
      clean({ proposal_id: String(message.proposalId), address: message.address || undefined }),
    fromAmino: (value: { proposal_id: string; address?: string }) =>
      MsgWithdrawProposal.fromPartial({ proposalId: BigInt(value.proposal_id), address: value.address ?? '' }),
  },
}

// verana-types 0.10.7 has no converters for these messages and keeps its AminoTypes register private.
export function withGroupAminoConverters(upstream: AminoTypes, registry: Registry): AminoTypes {
  class VeranaAminoTypes extends AminoTypes {
    toAmino(message: EncodeObject): AminoMsg {
      return (message.typeUrl in converters ? group : upstream).toAmino(message)
    }

    fromAmino(message: AminoMsg): EncodeObject {
      return (aminoTypes.has(message.type) ? group : upstream).fromAmino(message)
    }
  }

  const extended = new VeranaAminoTypes({})
  const converters = { ...groupAminoConverters, ...createGroupAminoConverters(() => extended, registry) }
  const group = new AminoTypes(converters)
  const aminoTypes = new Set(Object.values(converters).map((converter) => converter.aminoType))
  return extended
}
