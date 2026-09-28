import { HolderOnboardingMode } from '@verana-labs/verana-types/codec/verana/cs/v1/types'
import { describe, expect, it } from 'vitest'
import { digestAlgorithmOptions, holderOnboardingModeOptions } from './cs'

describe('schema creation options', () => {
  it('labels each holder onboarding mode with its chain value', () => {
    expect(holderOnboardingModeOptions).toEqual([
      {
        value: HolderOnboardingMode.HOLDER_ONBOARDING_MODE_ISSUER_ONBOARDING_PROCESS,
        label: { key: 'dataview.cs.managementMode.ISSUER_ONBOARDING_PROCESS', values: undefined },
      },
      {
        value: HolderOnboardingMode.HOLDER_ONBOARDING_MODE_PERMISSIONLESS,
        label: { key: 'dataview.cs.managementMode.PERMISSIONLESS', values: undefined },
      },
    ])
  })

  it('offers only the digest algorithms the chain accepts', () => {
    expect(digestAlgorithmOptions.map((option) => option.value)).toEqual(['sha384', 'sha512'])
  })
})
