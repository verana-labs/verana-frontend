import type { EncodeObject } from '@cosmjs/proto-signing'
import { MsgCreateCorporation } from '@verana-labs/verana-types/codec/verana/co/v1/tx'
import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { PercentageDecisionPolicy, ThresholdDecisionPolicy } from 'cosmjs-types/cosmos/group/v1/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { veranaAmino } from '@/config/veranaChain.sign.client'
import type { DecisionPolicyInput } from '@/lib/decision-policy'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import {
  buildCreateCorporationMessage,
  buildCreateCorporationMessages,
  buildGrantOperatorMessages,
} from './actionCorporation'

const THRESHOLD_POLICY: DecisionPolicyInput = {
  rule: { kind: 'threshold', threshold: '1' },
  votingPeriodSeconds: 60,
  minExecutionPeriodSeconds: 0,
}

describe('buildCreateCorporationMessage', () => {
  it('round-trips the V4 corporation bootstrap and Cosmos group policy', () => {
    const message = buildCreateCorporationMessage(
      {
        did: 'did:web:corporation.example',
        language: 'en',
        docUrl: 'https://example.com/corporation.pdf',
        decisionPolicy: THRESHOLD_POLICY,
      },
      'verana1signer',
      'sha384-corporation'
    )
    const value = MsgCreateCorporation.decode(
      MsgCreateCorporation.encode(message.value as MsgCreateCorporation).finish()
    )
    const decisionPolicy = ThresholdDecisionPolicy.decode(value.decisionPolicy?.value ?? new Uint8Array())

    expect(message.typeUrl).toBe('/verana.co.v1.MsgCreateCorporation')
    expect(value).toMatchObject({
      signer: 'verana1signer',
      members: [{ address: 'verana1signer', weight: '1', metadata: '' }],
      groupMetadata: '',
      groupPolicyMetadata: '',
      did: 'did:web:corporation.example',
      language: 'en',
      docUrl: 'https://example.com/corporation.pdf',
      docDigestSri: 'sha384-corporation',
    })
    expect(value.decisionPolicy?.typeUrl).toBe('/cosmos.group.v1.ThresholdDecisionPolicy')
    expect(decisionPolicy.threshold).toBe('1')
    expect(decisionPolicy.windows?.votingPeriod?.seconds).toBe(BigInt(60))
    expect(decisionPolicy.windows?.minExecutionPeriod?.seconds).toBe(BigInt(0))
  })

  it('carries a percentage policy and a minimum execution period, through Amino too', () => {
    const message = buildCreateCorporationMessage(
      {
        did: 'did:web:corporation.example',
        language: 'en',
        docUrl: 'https://example.com/corporation.pdf',
        decisionPolicy: {
          rule: { kind: 'percentage', percentage: '0.5' },
          votingPeriodSeconds: 300,
          minExecutionPeriodSeconds: 3_600,
        },
      },
      'verana1signer',
      'sha384-corporation'
    )
    const value = MsgCreateCorporation.decode(
      MsgCreateCorporation.encode(message.value as MsgCreateCorporation).finish()
    )
    expect(value.decisionPolicy?.typeUrl).toBe('/cosmos.group.v1.PercentageDecisionPolicy')
    expect(PercentageDecisionPolicy.decode(value.decisionPolicy?.value ?? new Uint8Array())).toEqual({
      percentage: '0.5',
      windows: {
        votingPeriod: { seconds: BigInt(300), nanos: 0 },
        minExecutionPeriod: { seconds: BigInt(3_600), nanos: 0 },
      },
    })

    const amino = veranaAmino.toAmino(message)
    expect(amino.value.decision_policy).toEqual({
      type: 'cosmos-sdk/PercentageDecisionPolicy',
      value: {
        percentage: '0.5',
        windows: { voting_period: '300000000000', min_execution_period: '3600000000000' },
      },
    })
    expect(veranaAmino.fromAmino(amino)).toEqual(message)
  })
})

describe('buildCreateCorporationMessages', () => {
  const params = {
    did: 'did:web:corporation.example',
    language: 'en',
    docUrl: 'https://example.com/corporation.pdf',
    decisionPolicy: THRESHOLD_POLICY,
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the document digest and yields the single create message createOnly broadcasts', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ sri: 'sha384-corporation' }) }))
    vi.stubGlobal('fetch', fetchMock)

    const messages = await buildCreateCorporationMessages(params, 'verana1signer')

    expect(fetchMock).toHaveBeenCalledWith('/api/sri?url=https%3A%2F%2Fexample.com%2Fcorporation.pdf')
    expect(messages).toEqual([buildCreateCorporationMessage(params, 'verana1signer', 'sha384-corporation')])
  })

  it('rejects when the digest endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }))
    )

    await expect(buildCreateCorporationMessages(params, 'verana1signer')).rejects.toThrow(
      'Unable to calculate the document digest'
    )
  })
})

describe('buildGrantOperatorMessages', () => {
  it('uses the corporation policy as the group-proposal operator', () => {
    const messages = buildGrantOperatorMessages(
      {
        id: 7,
        policyAddress: 'verana1policy',
        did: 'did:web:corporation.example',
      },
      'verana1operator',
      '0'
    )
    const proposalObject = messages.find((message) => message.typeUrl === '/cosmos.group.v1.MsgSubmitProposal')
    const proposal = MsgSubmitProposal.decode(
      MsgSubmitProposal.encode(proposalObject?.value as MsgSubmitProposal).finish()
    )
    const grant = MsgGrantOperatorAuthorization.decode(proposal.messages[0]?.value ?? new Uint8Array())

    expect(grant.corporation).toBe('verana1policy')
    expect(grant.operator).toBe('verana1policy')
    expect(grant.grantee).toBe('verana1operator')
    expect(proposal.messages[0]?.typeUrl).toBe('/verana.de.v1.MsgGrantOperatorAuthorization')
    expect(grant.msgTypes).toEqual(OPERATOR_GRANT_MESSAGE_TYPES)
    expect(grant.msgTypes).not.toContain('/verana.pp.v1.MsgCreateOrUpdateParticipantSession')
    expect(grant.msgTypes).toContain('/verana.pp.v1.MsgTriggerResolver')
    expect(grant.msgTypes).toContain('/verana.di.v1.MsgStoreDigest')
    expect(grant).toMatchObject({
      expiration: undefined,
      authzSpendLimit: [],
      authzSpendLimitPeriod: undefined,
      withFeegrant: false,
      feegrantSpendLimit: [],
      feegrantSpendLimitPeriod: undefined,
    })
  })

  it('funds only the exact corporation policy address when requested', () => {
    const messages = buildGrantOperatorMessages(
      { id: 7, policyAddress: 'verana1policy', did: 'did:web:corporation.example' },
      'verana1operator',
      '1000'
    )
    const bankMessage = messages.find((message) => message.typeUrl === '/cosmos.bank.v1beta1.MsgSend') as EncodeObject
    const value = MsgSend.decode(MsgSend.encode(bankMessage.value as MsgSend).finish())

    expect(value).toEqual({
      fromAddress: 'verana1operator',
      toAddress: 'verana1policy',
      amount: [{ denom: 'uvna', amount: '1000' }],
    })
  })
})
