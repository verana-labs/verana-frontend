import { Secp256k1HdWallet } from '@cosmjs/amino'
import type { EncodeObject } from '@cosmjs/proto-signing'
import { SigningStargateClient } from '@cosmjs/stargate'
import { Exec, MsgExec, MsgSubmitProposal, MsgWithdrawProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { describe, expect, it, vi } from 'vitest'
import { veranaAmino, veranaRegistry } from '@/config/veranaChain.sign.client'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import {
  buildUpdateCorporationMessage,
  buildUpdateDecisionPolicyMessage,
  buildUpdateMembersMessage,
} from '@/msg/actions_hooks/actionCorporationManage'

vi.mock('@cosmos-kit/react', () => ({ useChain: () => ({ address: undefined, isWalletConnected: false }) }))

const POLICY = 'verana1fsg6hw0pdvqujgktgx4k03s9ehe2ys2kmwyqsj'
const MEMBER = 'verana150jhghlww33g9plky323fyq3v4txfky677dxen'
const membership = { corporation: { policyAddress: POLICY } } as CorporationMembership

const members = buildUpdateMembersMessage(membership, 12, [
  { address: MEMBER, weight: '1' },
  { address: POLICY, weight: '0' },
])
const thresholdPolicy = buildUpdateDecisionPolicyMessage(membership, {
  rule: { kind: 'threshold', threshold: '3' },
  votingPeriodSeconds: 300,
  minExecutionPeriodSeconds: 0,
})
const percentagePolicy = buildUpdateDecisionPolicyMessage(membership, {
  rule: { kind: 'percentage', percentage: '0.6' },
  votingPeriodSeconds: 86_400,
  minExecutionPeriodSeconds: 3_600,
})
const exec: EncodeObject = {
  typeUrl: '/cosmos.group.v1.MsgExec',
  value: MsgExec.fromPartial({ proposalId: BigInt(46), executor: MEMBER }),
}
const withdraw: EncodeObject = {
  typeUrl: '/cosmos.group.v1.MsgWithdrawProposal',
  value: MsgWithdrawProposal.fromPartial({ proposalId: BigInt(46), address: MEMBER }),
}

function proposalWith(message: EncodeObject): EncodeObject {
  return {
    typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
    value: MsgSubmitProposal.fromPartial({
      groupPolicyAddress: POLICY,
      proposers: [MEMBER],
      messages: [veranaRegistry.encodeAsAny(message)],
      exec: Exec.EXEC_TRY,
      title: 'title',
      summary: 'summary',
    }),
  }
}

describe('group amino converters', () => {
  it('encodes the member update the way the chain does', () => {
    expect(veranaAmino.toAmino(members)).toEqual({
      type: 'cosmos-sdk/MsgUpdateGroupMembers',
      value: {
        admin: POLICY,
        group_id: '12',
        member_updates: [
          { address: MEMBER, weight: '1' },
          { address: POLICY, weight: '0' },
        ],
      },
    })
  })

  it('encodes the decision policy update under the chain amino name', () => {
    expect(veranaAmino.toAmino(thresholdPolicy)).toEqual({
      type: 'cosmos-sdk/MsgUpdateGroupDecisionPolicy',
      value: {
        admin: POLICY,
        group_policy_address: POLICY,
        decision_policy: {
          type: 'cosmos-sdk/ThresholdDecisionPolicy',
          value: { threshold: '3', windows: { voting_period: '300000000000', min_execution_period: '0' } },
        },
      },
    })
  })

  it('encodes exec and withdraw with the proposal id as a string', () => {
    expect(veranaAmino.toAmino(exec)).toEqual({
      type: 'cosmos-sdk/group/MsgExec',
      value: { proposal_id: '46', executor: MEMBER },
    })
    expect(veranaAmino.toAmino(withdraw)).toEqual({
      type: 'cosmos-sdk/group/MsgWithdrawProposal',
      value: { proposal_id: '46', address: MEMBER },
    })
  })

  it.each([
    ['members', members],
    ['threshold policy', thresholdPolicy],
    ['percentage policy', percentagePolicy],
    ['exec', exec],
    ['withdraw', withdraw],
  ])('round-trips %s', (_name, message) => {
    expect(veranaAmino.fromAmino(veranaAmino.toAmino(message))).toEqual(message)
  })

  it.each([
    ['members', members],
    ['threshold policy', thresholdPolicy],
    ['percentage policy', percentagePolicy],
    ['a verana message', buildUpdateCorporationMessage(membership, 'did:example:new', POLICY)],
  ])('round-trips a proposal wrapping %s', (_name, message) => {
    const proposal = proposalWith(message)
    expect(veranaAmino.fromAmino(veranaAmino.toAmino(proposal))).toEqual(proposal)
  })

  it('signs a proposal wrapping a member update with an amino-only wallet', async () => {
    const wallet = await Secp256k1HdWallet.generate(12, { prefix: 'verana' })
    const [{ address }] = await wallet.getAccounts()
    const client = await SigningStargateClient.offline(wallet, { aminoTypes: veranaAmino, registry: veranaRegistry })

    const signed = await client.sign(
      address,
      [proposalWith(members)],
      { amount: [{ denom: 'uvna', amount: '1000' }], gas: '200000' },
      '',
      { accountNumber: BigInt(1), sequence: 1, chainId: 'vna-testnet-1' }
    )

    expect(signed.signatures).toHaveLength(1)
  })
})
