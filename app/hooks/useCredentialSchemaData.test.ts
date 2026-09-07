import { describe, expect, it } from 'vitest'
import { parseCredentialSchemaResponse } from './useCredentialSchemaData'

const schema = {
  id: 12,
  ecosystem_id: 7,
  json_schema: '{"title":"Example"}',
  issuer_grantor_validation_validity_period: 11,
  verifier_grantor_validation_validity_period: 12,
  issuer_validation_validity_period: 21,
  verifier_validation_validity_period: 22,
  holder_validation_validity_period: 23,
  issuer_onboarding_mode: 'OPEN',
  verifier_onboarding_mode: 'GRANTOR_ONBOARDING_PROCESS',
  holder_onboarding_mode: 'PERMISSIONLESS',
  pricing_asset_type: 'TU',
  pricing_asset: 'tu',
  digest_algorithm: 'sha384',
  archived: null,
}

describe('parseCredentialSchemaResponse', () => {
  it('maps the complete V4 detail contract', () => {
    expect(parseCredentialSchemaResponse({ schema })).toMatchObject({
      id: 12,
      ecosystemId: 7,
      issuerOnboardingMode: 'OPEN',
      verifierOnboardingMode: 'GRANTOR_ONBOARDING_PROCESS',
      holderOnboardingMode: 'PERMISSIONLESS',
      pricingAssetType: 'TU',
      pricingAsset: 'tu',
      digestAlgorithm: 'sha384',
    })
  })

  it('rejects a bare detail object', () => {
    expect(() => parseCredentialSchemaResponse(schema)).toThrow('missing schema envelope')
  })
})
