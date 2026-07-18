import type { DeliverTxResponse } from '@cosmjs/stargate'
import {
  MsgCancelParticipantOPLastRequest,
  MsgCreateOrUpdateParticipantSession,
  MsgCreateRootParticipant,
  MsgRenewParticipantOP,
  MsgRepayParticipantSlashedTrustDeposit,
  MsgRevokeParticipant,
  MsgSelfCreateParticipant,
  MsgSetParticipantEffectiveUntil,
  MsgSetParticipantOPToValidated,
  MsgSlashParticipantTrustDeposit,
  MsgStartParticipantOP,
} from '@verana-labs/verana-types/codec/verana/pp/v1/tx'
import { ParticipantRole } from '@verana-labs/verana-types/codec/verana/pp/v1/types'
import { describe, expect, it } from 'vitest'
import { buildParticipantMessage, createdParticipantId, type ParticipantActionParams } from './actionParticipant'

const context = { corporation: 'verana1policy', operator: 'verana1operator' }
const common = { corporation: 'verana1policy', operator: 'verana1operator' }
const emptyVsOperatorAuthorization = {
  vsOperator: '',
  vsOperatorAuthzMsgTypes: [],
  vsOperatorAuthzSpendLimit: [],
  vsOperatorAuthzWithFeegrant: false,
  vsOperatorAuthzFeeSpendLimit: [],
  vsOperatorAuthzPeriod: undefined,
}

describe('buildParticipantMessage', () => {
  it('round-trips the V4 onboarding-process contract', () => {
    const message = buildParticipantMessage(
      {
        msgType: 'MsgStartParticipantOP',
        role: 'VERIFIER',
        validatorParticipantId: '9',
        did: 'did:web:verifier.example',
        validationFees: '11',
        issuanceFees: '12',
        verificationFees: '13',
      },
      context
    )
    const value = MsgStartParticipantOP.decode(
      MsgStartParticipantOP.encode(message.value as MsgStartParticipantOP).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgStartParticipantOP')
    expect(value).toEqual({
      ...common,
      role: ParticipantRole.VERIFIER,
      validatorParticipantId: 9,
      did: 'did:web:verifier.example',
      validationFees: { value: 11 },
      issuanceFees: { value: 12 },
      verificationFees: { value: 13 },
      ...emptyVsOperatorAuthorization,
    })
  })

  it('round-trips the OPEN self-create contract with its required validator', () => {
    const effectiveFrom = new Date('2026-07-18T00:00:00.000Z')
    const effectiveUntil = new Date('2026-08-18T00:00:00.000Z')
    const message = buildParticipantMessage(
      {
        msgType: 'MsgSelfCreateParticipant',
        role: 'ISSUER',
        validatorParticipantId: 5,
        did: 'did:web:issuer.example',
        effectiveFrom,
        effectiveUntil,
        validationFees: 1,
        verificationFees: 2,
      },
      context
    )
    const value = MsgSelfCreateParticipant.decode(
      MsgSelfCreateParticipant.encode(message.value as MsgSelfCreateParticipant).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgSelfCreateParticipant')
    expect(value).toEqual({
      ...common,
      role: ParticipantRole.ISSUER,
      validatorParticipantId: 5,
      did: 'did:web:issuer.example',
      effectiveFrom,
      effectiveUntil,
      validationFees: 1,
      verificationFees: 2,
      ...emptyVsOperatorAuthorization,
    })
  })

  it('round-trips every V4 root-participant field', () => {
    const effectiveFrom = new Date('2026-07-18T00:00:00.000Z')
    const effectiveUntil = new Date('2026-08-18T00:00:00.000Z')
    const message = buildParticipantMessage(
      {
        msgType: 'MsgCreateRootParticipant',
        schemaId: '7',
        did: 'did:web:ecosystem-participant.example',
        effectiveFrom,
        effectiveUntil,
        validationFees: 11,
        issuanceFees: 12,
        verificationFees: 13,
      },
      context
    )
    const value = MsgCreateRootParticipant.decode(
      MsgCreateRootParticipant.encode(message.value as MsgCreateRootParticipant).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgCreateRootParticipant')
    expect(value).toEqual({
      ...common,
      schemaId: 7,
      did: 'did:web:ecosystem-participant.example',
      effectiveFrom,
      effectiveUntil,
      validationFees: 11,
      issuanceFees: 12,
      verificationFees: 13,
      ...emptyVsOperatorAuthorization,
    })
  })

  it('round-trips every V4 validation decision field', () => {
    const effectiveUntil = new Date('2026-08-18T00:00:00.000Z')
    const message = buildParticipantMessage(
      {
        msgType: 'MsgSetParticipantOPToValidated',
        id: '7',
        effectiveUntil,
        validationFees: 11,
        issuanceFees: 12,
        verificationFees: 13,
        opSummaryDigest: 'sha384-summary',
        issuanceFeeDiscount: 14,
        verificationFeeDiscount: 15,
      },
      context
    )
    const value = MsgSetParticipantOPToValidated.decode(
      MsgSetParticipantOPToValidated.encode(message.value as MsgSetParticipantOPToValidated).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgSetParticipantOPToValidated')
    expect(value).toEqual({
      ...common,
      id: 7,
      effectiveUntil,
      validationFees: 11,
      issuanceFees: 12,
      verificationFees: 13,
      opSummaryDigest: 'sha384-summary',
      issuanceFeeDiscount: 14,
      verificationFeeDiscount: 15,
    })
  })

  it('round-trips the V4 effective-until adjustment', () => {
    const effectiveUntil = new Date('2026-08-18T00:00:00.000Z')
    const message = buildParticipantMessage(
      { msgType: 'MsgSetParticipantEffectiveUntil', id: '7', effectiveUntil },
      context
    )
    const value = MsgSetParticipantEffectiveUntil.decode(
      MsgSetParticipantEffectiveUntil.encode(message.value as MsgSetParticipantEffectiveUntil).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgSetParticipantEffectiveUntil')
    expect(value).toEqual({ ...common, id: 7, effectiveUntil })
  })

  it('round-trips the V4 participant-session identifiers', () => {
    const message = buildParticipantMessage(
      {
        msgType: 'MsgCreateOrUpdateParticipantSession',
        id: 'session-7',
        issuerParticipantId: '11',
        verifierParticipantId: '12',
        agentParticipantId: '13',
        walletAgentParticipantId: '14',
        digest: 'sha384-session',
      },
      context
    )
    const value = MsgCreateOrUpdateParticipantSession.decode(
      MsgCreateOrUpdateParticipantSession.encode(message.value as MsgCreateOrUpdateParticipantSession).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgCreateOrUpdateParticipantSession')
    expect(value).toEqual({
      ...common,
      id: 'session-7',
      issuerParticipantId: 11,
      verifierParticipantId: 12,
      agentParticipantId: 13,
      walletAgentParticipantId: 14,
      digest: 'sha384-session',
    })
  })

  it('round-trips the V4 participant slashing contract', () => {
    const message = buildParticipantMessage(
      { msgType: 'MsgSlashParticipantTrustDeposit', id: '7', amount: '21', reason: 'invalid credential' },
      context
    )
    const value = MsgSlashParticipantTrustDeposit.decode(
      MsgSlashParticipantTrustDeposit.encode(message.value as MsgSlashParticipantTrustDeposit).finish()
    )

    expect(message.typeUrl).toBe('/verana.pp.v1.MsgSlashParticipantTrustDeposit')
    expect(value).toEqual({ ...common, id: 7, amount: 21, reason: 'invalid credential' })
  })

  it.each([
    {
      params: { msgType: 'MsgRenewParticipantOP', id: '7' } as const,
      typeUrl: '/verana.pp.v1.MsgRenewParticipantOP',
      roundTrip: (value: unknown) =>
        MsgRenewParticipantOP.decode(MsgRenewParticipantOP.encode(value as MsgRenewParticipantOP).finish()),
    },
    {
      params: { msgType: 'MsgCancelParticipantOPLastRequest', id: '7' } as const,
      typeUrl: '/verana.pp.v1.MsgCancelParticipantOPLastRequest',
      roundTrip: (value: unknown) =>
        MsgCancelParticipantOPLastRequest.decode(
          MsgCancelParticipantOPLastRequest.encode(value as MsgCancelParticipantOPLastRequest).finish()
        ),
    },
    {
      params: { msgType: 'MsgRevokeParticipant', id: '7' } as const,
      typeUrl: '/verana.pp.v1.MsgRevokeParticipant',
      roundTrip: (value: unknown) =>
        MsgRevokeParticipant.decode(MsgRevokeParticipant.encode(value as MsgRevokeParticipant).finish()),
    },
    {
      params: { msgType: 'MsgRepayParticipantSlashedTrustDeposit', id: '7' } as const,
      typeUrl: '/verana.pp.v1.MsgRepayParticipantSlashedTrustDeposit',
      roundTrip: (value: unknown) =>
        MsgRepayParticipantSlashedTrustDeposit.decode(
          MsgRepayParticipantSlashedTrustDeposit.encode(value as MsgRepayParticipantSlashedTrustDeposit).finish()
        ),
    },
  ])('round-trips $params.msgType with the V4 corporation contract', ({ params, typeUrl, roundTrip }) => {
    const message = buildParticipantMessage(params as ParticipantActionParams, context)

    expect(message.typeUrl).toBe(typeUrl)
    expect(roundTrip(message.value)).toEqual({ ...common, id: 7 })
  })
})

describe('createdParticipantId', () => {
  it('reads the dev.25 create_participant event emitted by OPEN self-create', () => {
    const result: DeliverTxResponse = {
      code: 0,
      height: 18_703,
      txIndex: 0,
      transactionHash: 'ABC',
      rawLog: '',
      gasWanted: BigInt(1),
      gasUsed: BigInt(1),
      events: [{ type: 'create_participant', attributes: [{ key: 'participant_id', value: '6' }] }],
      msgResponses: [],
    }

    expect(
      createdParticipantId(
        {
          msgType: 'MsgSelfCreateParticipant',
          role: 'ISSUER',
          validatorParticipantId: 5,
          did: 'did:web:issuer.example',
        },
        result
      )
    ).toBe('6')
  })
})
