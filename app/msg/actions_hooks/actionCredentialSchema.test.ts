import {
  MsgArchiveCredentialSchema,
  MsgCreateCredentialSchema,
  MsgUpdateCredentialSchema,
} from '@verana-labs/verana-types/codec/verana/cs/v1/tx'
import { HolderOnboardingMode, PricingAssetType } from '@verana-labs/verana-types/codec/verana/cs/v1/types'
import { describe, expect, it } from 'vitest'
import { buildCredentialSchemaMessage } from './actionCredentialSchema'

const context = { corporation: 'verana1policy', operator: 'verana1operator' }

describe('buildCredentialSchemaMessage', () => {
  it('round-trips every V4 create field and validity period as a day count', () => {
    const message = buildCredentialSchemaMessage(
      {
        msgType: 'MsgCreateCredentialSchema',
        ecosystemId: 7,
        jsonSchema: '{"title":"Example"}',
        issuerGrantorValidationValidityPeriod: 11,
        verifierGrantorValidationValidityPeriod: 12,
        issuerValidationValidityPeriod: 21,
        verifierValidationValidityPeriod: 22,
        holderValidationValidityPeriod: 23,
        issuerOnboardingMode: 3,
        verifierOnboardingMode: 2,
        holderOnboardingMode: HolderOnboardingMode.HOLDER_ONBOARDING_MODE_ISSUER_ONBOARDING_PROCESS,
        digestAlgorithm: 'sha512',
      },
      context
    )
    const value = MsgCreateCredentialSchema.decode(
      MsgCreateCredentialSchema.encode(message.value as MsgCreateCredentialSchema).finish()
    )

    expect(message.typeUrl).toBe('/verana.cs.v1.MsgCreateCredentialSchema')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      ecosystemId: 7,
      jsonSchema: '{"title":"Example"}',
      issuerGrantorValidationValidityPeriod: { value: 11 },
      verifierGrantorValidationValidityPeriod: { value: 12 },
      issuerValidationValidityPeriod: { value: 21 },
      verifierValidationValidityPeriod: { value: 22 },
      holderValidationValidityPeriod: { value: 23 },
      issuerOnboardingMode: 3,
      verifierOnboardingMode: 2,
      holderOnboardingMode: HolderOnboardingMode.HOLDER_ONBOARDING_MODE_ISSUER_ONBOARDING_PROCESS,
      pricingAssetType: PricingAssetType.COIN,
      pricingAsset: 'uvna',
      digestAlgorithm: 'sha512',
    })
  })

  it.each([
    [HolderOnboardingMode.HOLDER_ONBOARDING_MODE_PERMISSIONLESS, 'sha384'],
    [HolderOnboardingMode.HOLDER_ONBOARDING_MODE_ISSUER_ONBOARDING_PROCESS, 'sha384'],
    [HolderOnboardingMode.HOLDER_ONBOARDING_MODE_PERMISSIONLESS, 'sha512'],
  ])('carries holder onboarding mode %i and digest algorithm %s from the form', (holderOnboardingMode, digestAlgorithm) => {
    const message = buildCredentialSchemaMessage(
      {
        msgType: 'MsgCreateCredentialSchema',
        ecosystemId: 7,
        jsonSchema: '{"title":"Example"}',
        issuerGrantorValidationValidityPeriod: 0,
        verifierGrantorValidationValidityPeriod: 0,
        issuerValidationValidityPeriod: 0,
        verifierValidationValidityPeriod: 0,
        holderValidationValidityPeriod: 0,
        issuerOnboardingMode: 1,
        verifierOnboardingMode: 1,
        holderOnboardingMode,
        digestAlgorithm,
      },
      context
    )
    const value = MsgCreateCredentialSchema.decode(
      MsgCreateCredentialSchema.encode(message.value as MsgCreateCredentialSchema).finish()
    )

    expect(value.holderOnboardingMode).toBe(holderOnboardingMode)
    expect(value.digestAlgorithm).toBe(digestAlgorithm)
  })

  it('round-trips every mutable V4 day-count field', () => {
    const message = buildCredentialSchemaMessage(
      {
        msgType: 'MsgUpdateCredentialSchema',
        id: '7',
        issuerGrantorValidationValidityPeriod: 31,
        verifierGrantorValidationValidityPeriod: 32,
        issuerValidationValidityPeriod: 41,
        verifierValidationValidityPeriod: 42,
        holderValidationValidityPeriod: 43,
      },
      context
    )
    const value = MsgUpdateCredentialSchema.decode(
      MsgUpdateCredentialSchema.encode(message.value as MsgUpdateCredentialSchema).finish()
    )

    expect(message.typeUrl).toBe('/verana.cs.v1.MsgUpdateCredentialSchema')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      id: 7,
      issuerGrantorValidationValidityPeriod: { value: 31 },
      verifierGrantorValidationValidityPeriod: { value: 32 },
      issuerValidationValidityPeriod: { value: 41 },
      verifierValidationValidityPeriod: { value: 42 },
      holderValidationValidityPeriod: { value: 43 },
    })
  })

  it.each([
    ['MsgArchiveCredentialSchema', true],
    ['MsgUnarchiveCredentialSchema', false],
  ] as const)('round-trips %s through the V4 archive toggle', (msgType, archive) => {
    const message = buildCredentialSchemaMessage({ msgType, id: '7' }, context)
    const value = MsgArchiveCredentialSchema.decode(
      MsgArchiveCredentialSchema.encode(message.value as MsgArchiveCredentialSchema).finish()
    )

    expect(message.typeUrl).toBe('/verana.cs.v1.MsgArchiveCredentialSchema')
    expect(value).toEqual({
      corporation: 'verana1policy',
      operator: 'verana1operator',
      id: 7,
      archive,
    })
  })
})
