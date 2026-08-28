import { describe, expect, it } from 'vitest'
import { getParticipantJoinMessage, getParticipantOnboardingDecision } from './participant-onboarding'

describe('getParticipantJoinMessage', () => {
  it.each([
    ['OPEN', 'MsgSelfCreateParticipant'],
    ['ECOSYSTEM_ONBOARDING_PROCESS', 'MsgStartParticipantOP'],
    ['GRANTOR_ONBOARDING_PROCESS', 'MsgStartParticipantOP'],
  ] as const)('maps %s to %s', (mode, expected) => {
    expect(getParticipantJoinMessage(mode)).toBe(expected)
  })
})

describe('getParticipantOnboardingDecision', () => {
  const schemaModes = {
    issuerOnboardingMode: 'GRANTOR_ONBOARDING_PROCESS' as const,
    verifierOnboardingMode: 'ECOSYSTEM_ONBOARDING_PROCESS' as const,
    holderOnboardingMode: 'ISSUER_ONBOARDING_PROCESS' as const,
  }

  it.each([
    ['ISSUER_GRANTOR', 'ECOSYSTEM'],
    ['ISSUER', 'ISSUER_GRANTOR'],
    ['VERIFIER_GRANTOR', 'ECOSYSTEM'],
    ['VERIFIER', 'ECOSYSTEM'],
    ['HOLDER', 'ISSUER'],
  ] as const)('selects %s validators from %s participants', (role, validatorRole) => {
    expect(getParticipantOnboardingDecision(role, schemaModes)).toEqual({
      messageType: 'MsgStartParticipantOP',
      validatorRole,
    })
  })

  it('self-creates open issuer and verifier participants under an ecosystem validator', () => {
    expect(getParticipantOnboardingDecision('ISSUER', { ...schemaModes, issuerOnboardingMode: 'OPEN' })).toEqual({
      messageType: 'MsgSelfCreateParticipant',
      validatorRole: 'ECOSYSTEM',
    })
    expect(getParticipantOnboardingDecision('VERIFIER', { ...schemaModes, verifierOnboardingMode: 'OPEN' })).toEqual({
      messageType: 'MsgSelfCreateParticipant',
      validatorRole: 'ECOSYSTEM',
    })
  })

  it('does not create an on-chain participant for a permissionless holder', () => {
    expect(() =>
      getParticipantOnboardingDecision('HOLDER', { ...schemaModes, holderOnboardingMode: 'PERMISSIONLESS' })
    ).toThrow('Permissionless holders do not create on-chain participants')
  })

  it('rejects a holder role when the schema has no holder onboarding mode', () => {
    expect(() => getParticipantOnboardingDecision('HOLDER', { ...schemaModes, holderOnboardingMode: null })).toThrow(
      'Holder onboarding mode is not configured'
    )
  })
})
