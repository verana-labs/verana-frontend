import { describe, expect, it } from 'vitest'
import { isHolderOnboardingMode } from './participant-onboarding'

describe('isHolderOnboardingMode', () => {
  it('accepts only the indexer holder onboarding modes', () => {
    expect(isHolderOnboardingMode('PERMISSIONLESS')).toBe(true)
    expect(isHolderOnboardingMode('ISSUER_ONBOARDING_PROCESS')).toBe(true)
    expect(isHolderOnboardingMode(2)).toBe(false)
    expect(isHolderOnboardingMode(null)).toBe(false)
  })
})
