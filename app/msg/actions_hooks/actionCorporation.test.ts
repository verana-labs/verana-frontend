import type { EncodeObject } from '@cosmjs/proto-signing'
import { MsgCreateCorporation } from '@verana-labs/verana-types/codec/verana/co/v1/tx'
import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { ThresholdDecisionPolicy } from 'cosmjs-types/cosmos/group/v1/types'
import { describe, expect, it } from 'vitest'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { buildCreateCorporationMessage, buildGrantOperatorMessages } from './actionCorporation'

describe('buildCreateCorporationMessage', () => {
  it('round-trips the V4 corporation bootstrap and Cosmos group policy', () => {
    const message = buildCreateCorporationMessage(
      {
        did: 'did:web:corporation.example',
        language: 'en',
        docUrl: 'https://example.com/corporation.pdf',
        fundingUvna: '1000',
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
