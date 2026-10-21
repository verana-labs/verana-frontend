export type ParticipantOnboardingMode = 'OPEN' | 'ECOSYSTEM_ONBOARDING_PROCESS' | 'GRANTOR_ONBOARDING_PROCESS'
export type HolderOnboardingMode = 'ISSUER_ONBOARDING_PROCESS' | 'PERMISSIONLESS'

export function isHolderOnboardingMode(value: unknown): value is HolderOnboardingMode {
  return value === 'ISSUER_ONBOARDING_PROCESS' || value === 'PERMISSIONLESS'
}
