export type ParticipantOnboardingMode = 'OPEN' | 'ECOSYSTEM_ONBOARDING_PROCESS' | 'GRANTOR_ONBOARDING_PROCESS'
export type HolderOnboardingMode = 'ISSUER_ONBOARDING_PROCESS' | 'PERMISSIONLESS'
export type JoinableParticipantRole = 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER' | 'VERIFIER' | 'HOLDER'

type ParticipantOnboardingModes = {
  issuerOnboardingMode: ParticipantOnboardingMode
  verifierOnboardingMode: ParticipantOnboardingMode
  holderOnboardingMode: HolderOnboardingMode | null
}

export type ParticipantOnboardingDecision =
  | {
      messageType: 'MsgSelfCreateParticipant' | 'MsgStartParticipantOP'
      validatorRole: 'ECOSYSTEM' | 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER'
    }
  | { messageType: null; validatorRole: null }

export function getParticipantJoinMessage(
  onboardingMode: ParticipantOnboardingMode
): 'MsgSelfCreateParticipant' | 'MsgStartParticipantOP' {
  return onboardingMode === 'OPEN' ? 'MsgSelfCreateParticipant' : 'MsgStartParticipantOP'
}

export function getParticipantOnboardingDecision(
  role: JoinableParticipantRole,
  modes: ParticipantOnboardingModes
): ParticipantOnboardingDecision {
  if (role === 'ISSUER_GRANTOR' || role === 'VERIFIER_GRANTOR') {
    return { messageType: 'MsgStartParticipantOP', validatorRole: 'ECOSYSTEM' }
  }
  if (role === 'HOLDER') {
    if (modes.holderOnboardingMode === null) throw new Error('Holder onboarding mode is not configured')
    if (modes.holderOnboardingMode === 'PERMISSIONLESS') return { messageType: null, validatorRole: null }
    return { messageType: 'MsgStartParticipantOP', validatorRole: 'ISSUER' }
  }

  const mode = role === 'ISSUER' ? modes.issuerOnboardingMode : modes.verifierOnboardingMode
  if (mode === 'OPEN') return { messageType: 'MsgSelfCreateParticipant', validatorRole: 'ECOSYSTEM' }
  if (mode === 'ECOSYSTEM_ONBOARDING_PROCESS') {
    return { messageType: 'MsgStartParticipantOP', validatorRole: 'ECOSYSTEM' }
  }
  return {
    messageType: 'MsgStartParticipantOP',
    validatorRole: role === 'ISSUER' ? 'ISSUER_GRANTOR' : 'VERIFIER_GRANTOR',
  }
}

export type EffectiveWindowIssue = 'fromInPast' | 'untilNotAfterFrom' | 'untilRequired' | 'untilAfterValidator'

export function effectiveWindowIssue(
  window: { from: Date | undefined; until: Date | undefined },
  validatorUntil: Date | undefined,
  now: Date
): EffectiveWindowIssue | null {
  if (window.from && window.from.getTime() < now.getTime()) return 'fromInPast'
  if (!window.until) return validatorUntil ? 'untilRequired' : null
  if (window.until.getTime() <= (window.from ?? now).getTime()) return 'untilNotAfterFrom'
  if (validatorUntil && window.until.getTime() > validatorUntil.getTime()) return 'untilAfterValidator'
  return null
}

export type SelfCreateInput = {
  effectiveFrom: string
  effectiveUntil: string
  validationFees: string
  verificationFees: string
}

export const EMPTY_SELF_CREATE_INPUT: SelfCreateInput = {
  effectiveFrom: '',
  effectiveUntil: '',
  validationFees: '',
  verificationFees: '',
}

export type SelfCreateIssue = EffectiveWindowIssue | 'invalidFees'

function optionalDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function validFee(fee: string): boolean {
  const value = fee.trim()
  return value === '' || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)))
}

export function selfCreateIssue(
  input: SelfCreateInput,
  validatorUntil: string | null | undefined,
  now: Date,
  withFees: boolean
): SelfCreateIssue | null {
  const fees = withFees ? [input.validationFees, input.verificationFees] : []
  if (!fees.every(validFee)) return 'invalidFees'
  return effectiveWindowIssue(
    { from: optionalDate(input.effectiveFrom), until: optionalDate(input.effectiveUntil) },
    optionalDate(validatorUntil),
    now
  )
}
