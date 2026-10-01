import { describe, expect, it } from 'vitest'
import {
  EMPTY_SELF_CREATE_INPUT,
  effectiveWindowIssue,
  getParticipantJoinMessage,
  getParticipantOnboardingDecision,
  selfCreateIssue,
} from './participant-onboarding'

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

  it('needs no on-chain onboarding for a permissionless holder', () => {
    expect(
      getParticipantOnboardingDecision('HOLDER', { ...schemaModes, holderOnboardingMode: 'PERMISSIONLESS' })
    ).toEqual({ messageType: null, validatorRole: null })
  })

  it('rejects a holder role when the schema has no holder onboarding mode', () => {
    expect(() => getParticipantOnboardingDecision('HOLDER', { ...schemaModes, holderOnboardingMode: null })).toThrow(
      'Holder onboarding mode is not configured'
    )
  })
})

describe('effectiveWindowIssue', () => {
  const now = new Date('2026-09-28T10:00:00Z')
  const at = (iso: string) => new Date(iso)

  it('accepts an open window under a validator that never expires', () => {
    expect(effectiveWindowIssue({ from: undefined, until: undefined }, undefined, now)).toBeNull()
    expect(effectiveWindowIssue({ from: at('2026-10-01T00:00:00Z'), until: undefined }, undefined, now)).toBeNull()
  })

  it('refuses a start before the current time', () => {
    expect(effectiveWindowIssue({ from: at('2026-09-27T00:00:00Z'), until: undefined }, undefined, now)).toBe(
      'fromInPast'
    )
  })

  it('refuses an end that is not after the start, or after now when the start is open', () => {
    const from = at('2026-10-01T00:00:00Z')
    expect(effectiveWindowIssue({ from, until: from }, undefined, now)).toBe('untilNotAfterFrom')
    expect(effectiveWindowIssue({ from: undefined, until: at('2026-09-28T09:00:00Z') }, undefined, now)).toBe(
      'untilNotAfterFrom'
    )
  })

  it('requires an end within the window of a validator that expires', () => {
    const validatorUntil = at('2027-01-01T00:00:00Z')
    expect(effectiveWindowIssue({ from: undefined, until: undefined }, validatorUntil, now)).toBe('untilRequired')
    expect(effectiveWindowIssue({ from: undefined, until: at('2027-02-01T00:00:00Z') }, validatorUntil, now)).toBe(
      'untilAfterValidator'
    )
    expect(effectiveWindowIssue({ from: undefined, until: validatorUntil }, validatorUntil, now)).toBeNull()
  })
})

describe('selfCreateIssue', () => {
  const now = new Date('2026-09-28T10:00:00Z')

  it('accepts the empty form', () => {
    expect(selfCreateIssue(EMPTY_SELF_CREATE_INPUT, null, now, true)).toBeNull()
  })

  it('refuses fees that are not whole base units', () => {
    expect(selfCreateIssue({ ...EMPTY_SELF_CREATE_INPUT, validationFees: '1.5' }, null, now, true)).toBe('invalidFees')
    expect(selfCreateIssue({ ...EMPTY_SELF_CREATE_INPUT, verificationFees: '-3' }, null, now, true)).toBe('invalidFees')
    expect(selfCreateIssue({ ...EMPTY_SELF_CREATE_INPUT, validationFees: '2500000' }, null, now, true)).toBeNull()
  })

  it('refuses fees the signed message could not carry exactly', () => {
    const max = String(Number.MAX_SAFE_INTEGER)
    expect(selfCreateIssue({ ...EMPTY_SELF_CREATE_INPUT, validationFees: max }, null, now, true)).toBeNull()
    expect(selfCreateIssue({ ...EMPTY_SELF_CREATE_INPUT, validationFees: '9007199254740992' }, null, now, true)).toBe(
      'invalidFees'
    )
    expect(selfCreateIssue({ ...EMPTY_SELF_CREATE_INPUT, verificationFees: '1'.repeat(30) }, null, now, true)).toBe(
      'invalidFees'
    )
  })

  it('ignores fees left from another role when the fee fields are not shown', () => {
    const stale = { ...EMPTY_SELF_CREATE_INPUT, validationFees: '1.5', verificationFees: 'abc' }
    expect(selfCreateIssue(stale, null, now, true)).toBe('invalidFees')
    expect(selfCreateIssue(stale, null, now, false)).toBeNull()
  })

  it('checks the window against the validator it reads from the indexer', () => {
    expect(selfCreateIssue(EMPTY_SELF_CREATE_INPUT, '2027-01-01T00:00:00.000Z', now, false)).toBe('untilRequired')
    expect(
      selfCreateIssue(
        { ...EMPTY_SELF_CREATE_INPUT, effectiveUntil: '2026-12-01T00:00' },
        '2027-01-01T00:00:00.000Z',
        now,
        false
      )
    ).toBeNull()
  })
})
