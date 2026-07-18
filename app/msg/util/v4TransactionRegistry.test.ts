import type { EncodeObject } from '@cosmjs/proto-signing'
import { describe, expect, it } from 'vitest'
import { veranaAmino, veranaRegistry } from '@/config/veranaChain.sign.client'
import { buildCreateCorporationMessage, buildGrantOperatorMessages } from '@/msg/actions_hooks/actionCorporation'
import { buildCredentialSchemaMessage } from '@/msg/actions_hooks/actionCredentialSchema'
import { buildStoreDigestMessage } from '@/msg/actions_hooks/actionDigest'
import { buildEcosystemMessage } from '@/msg/actions_hooks/actionEcosystem'
import { buildParticipantMessage } from '@/msg/actions_hooks/actionParticipant'
import { buildTrustDepositMessage } from '@/msg/actions_hooks/actionTrustDeposit'

const context = { corporation: 'verana1policy', operator: 'verana1operator' }
const effectiveFrom = new Date('2026-07-18T00:00:00.000Z')
const effectiveUntil = new Date('2026-08-18T00:00:00.000Z')

const messages: EncodeObject[] = [
  buildCreateCorporationMessage(
    {
      did: 'did:web:corporation.example',
      language: 'en',
      docUrl: 'https://example.com/corporation.pdf',
      fundingUvna: '1000',
    },
    'verana1operator',
    'sha384-corporation'
  ),
  ...buildGrantOperatorMessages(
    { id: 1, policyAddress: 'verana1policy', did: 'did:web:corporation.example' },
    'verana1operator',
    '1000'
  ),
  buildEcosystemMessage(
    {
      msgType: 'MsgCreateEcosystem',
      did: 'did:web:ecosystem.example',
      language: 'en',
      docUrl: 'https://example.com/framework.pdf',
      docDigestSri: 'sha384-framework',
    },
    context
  ),
  buildEcosystemMessage({ msgType: 'MsgUpdateEcosystem', id: 1, did: 'did:web:ecosystem-updated.example' }, context),
  buildEcosystemMessage({ msgType: 'MsgArchiveEcosystem', id: 1 }, context),
  buildEcosystemMessage(
    {
      msgType: 'MsgAddGovernanceFrameworkDocument',
      ecosystemId: 1,
      targetVersion: 2,
      docLanguage: 'en',
      docUrl: 'https://example.com/framework-v2.pdf',
      docDigestSri: 'sha384-framework-v2',
    },
    context
  ),
  buildEcosystemMessage({ msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion', ecosystemId: 1 }, context),
  buildCredentialSchemaMessage(
    {
      msgType: 'MsgCreateCredentialSchema',
      ecosystemId: 1,
      jsonSchema: '{"title":"Example"}',
      issuerGrantorValidationValidityPeriod: 11,
      verifierGrantorValidationValidityPeriod: 12,
      issuerValidationValidityPeriod: 21,
      verifierValidationValidityPeriod: 22,
      holderValidationValidityPeriod: 23,
      issuerOnboardingMode: 1,
      verifierOnboardingMode: 1,
    },
    context
  ),
  buildCredentialSchemaMessage(
    {
      msgType: 'MsgUpdateCredentialSchema',
      id: 1,
      issuerGrantorValidationValidityPeriod: 31,
      verifierGrantorValidationValidityPeriod: 32,
      issuerValidationValidityPeriod: 41,
      verifierValidationValidityPeriod: 42,
      holderValidationValidityPeriod: 43,
    },
    context
  ),
  buildCredentialSchemaMessage({ msgType: 'MsgArchiveCredentialSchema', id: 1 }, context),
  buildParticipantMessage(
    {
      msgType: 'MsgStartParticipantOP',
      role: 'ISSUER',
      validatorParticipantId: 1,
      did: 'did:web:issuer.example',
      validationFees: 11,
      issuanceFees: 12,
      verificationFees: 13,
    },
    context
  ),
  buildParticipantMessage(
    {
      msgType: 'MsgSelfCreateParticipant',
      role: 'ISSUER',
      validatorParticipantId: 1,
      did: 'did:web:issuer.example',
      effectiveFrom,
      effectiveUntil,
      validationFees: 11,
      verificationFees: 13,
    },
    context
  ),
  buildParticipantMessage(
    {
      msgType: 'MsgCreateRootParticipant',
      schemaId: 1,
      did: 'did:web:root.example',
      effectiveFrom,
      effectiveUntil,
      validationFees: 11,
      issuanceFees: 12,
      verificationFees: 13,
    },
    context
  ),
  buildParticipantMessage({ msgType: 'MsgRenewParticipantOP', id: 1 }, context),
  buildParticipantMessage(
    {
      msgType: 'MsgSetParticipantOPToValidated',
      id: 1,
      effectiveUntil,
      validationFees: 11,
      issuanceFees: 12,
      verificationFees: 13,
      opSummaryDigest: 'sha384-summary',
      issuanceFeeDiscount: 14,
      verificationFeeDiscount: 15,
    },
    context
  ),
  buildParticipantMessage({ msgType: 'MsgCancelParticipantOPLastRequest', id: 1 }, context),
  buildParticipantMessage({ msgType: 'MsgSetParticipantEffectiveUntil', id: 1, effectiveUntil }, context),
  buildParticipantMessage({ msgType: 'MsgRevokeParticipant', id: 1 }, context),
  buildParticipantMessage(
    {
      msgType: 'MsgCreateOrUpdateParticipantSession',
      id: 'session-1',
      issuerParticipantId: 1,
      verifierParticipantId: 2,
      agentParticipantId: 3,
      walletAgentParticipantId: 4,
      digest: 'sha384-session',
    },
    context
  ),
  buildParticipantMessage({ msgType: 'MsgSlashParticipantTrustDeposit', id: 1, amount: 11, reason: 'test' }, context),
  buildParticipantMessage({ msgType: 'MsgRepayParticipantSlashedTrustDeposit', id: 1 }, context),
  buildTrustDepositMessage({ msgType: 'MsgReclaimTrustDepositYield' }, context),
  buildTrustDepositMessage({ msgType: 'MsgRepaySlashedTrustDeposit', deposit: 11 }, context),
  buildStoreDigestMessage('sha384-digest', context),
]

describe('dev.25 transaction registries', () => {
  it.each(
    messages.map((message) => [message.typeUrl, message] as const)
  )('direct-signing registry encodes %s', (typeUrl, message) => {
    const encoded = veranaRegistry.encodeAsAny(message)

    expect(encoded.typeUrl).toBe(typeUrl)
    expect(encoded.value.length).toBeGreaterThan(0)
  })

  it.each(
    messages.map((message) => [message.typeUrl, message] as const)
  )('Amino fallback registry converts %s', (_typeUrl, message) => {
    const amino = veranaAmino.toAmino(message)

    expect(amino.type).not.toBe('')
    expect(amino.value).toBeTypeOf('object')
  })
})
