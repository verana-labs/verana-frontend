export type ParticipantOnboardingMode = 'OPEN' | 'ECOSYSTEM_ONBOARDING_PROCESS' | 'GRANTOR_ONBOARDING_PROCESS'
export type HolderOnboardingMode = 'ISSUER_ONBOARDING_PROCESS' | 'PERMISSIONLESS'
export type JoinableParticipantRole = 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER' | 'VERIFIER' | 'HOLDER'

type ParticipantOnboardingModes = {
  issuerOnboardingMode: ParticipantOnboardingMode
  verifierOnboardingMode: ParticipantOnboardingMode
  holderOnboardingMode: HolderOnboardingMode | null
}

export type ParticipantOnboardingDecision = {
  messageType: 'MsgSelfCreateParticipant' | 'MsgStartParticipantOP'
  validatorRole: 'ECOSYSTEM' | 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER' | null
}

export function participantOnboardingMode(
  role: string,
  schema: { issuerOnboardingMode: string; verifierOnboardingMode: string; holderOnboardingMode: string | null }
): string {
  switch (role) {
    case 'ISSUER_GRANTOR':
    case 'VERIFIER_GRANTOR':
      return 'GRANTOR_ONBOARDING_PROCESS'
    case 'ISSUER':
      return schema.issuerOnboardingMode
    case 'VERIFIER':
      return schema.verifierOnboardingMode
    case 'HOLDER':
      return schema.holderOnboardingMode ?? 'ISSUER_ONBOARDING_PROCESS'
    default:
      return ''
  }
}

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
    if (modes.holderOnboardingMode === 'PERMISSIONLESS') {
      throw new Error('Permissionless holders do not create on-chain participants')
    }
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
