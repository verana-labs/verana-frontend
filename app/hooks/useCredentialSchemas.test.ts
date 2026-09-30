import { describe, expect, it } from 'vitest'
import { ecosystemSchemasUrl, parseCredentialSchemasResponse } from './useCredentialSchemas'

const schema = {
  id: 12,
  ecosystem_id: 7,
  json_schema: '{"title":"Example"}',
  issuer_grantor_validation_validity_period: 11,
  verifier_grantor_validation_validity_period: 12,
  issuer_validation_validity_period: 21,
  verifier_validation_validity_period: 22,
  holder_validation_validity_period: 23,
  issuer_onboarding_mode: 'GRANTOR_ONBOARDING_PROCESS',
  verifier_onboarding_mode: 'ECOSYSTEM_ONBOARDING_PROCESS',
  holder_onboarding_mode: 'ISSUER_ONBOARDING_PROCESS',
  pricing_asset_type: 'COIN',
  pricing_asset: 'uvna',
  participants: 3,
  weight: '4',
  issued: 5,
  verified: 6,
  archived: null,
}

describe('parseCredentialSchemasResponse', () => {
  it('keeps all five day-count periods distinct', () => {
    expect(parseCredentialSchemasResponse({ schemas: [schema] })).toEqual([
      expect.objectContaining({
        issuerGrantorValidationValidityPeriod: 11,
        verifierGrantorValidationValidityPeriod: 12,
        issuerValidationValidityPeriod: 21,
        verifierValidationValidityPeriod: 22,
        holderValidationValidityPeriod: 23,
        weight: '4',
      }),
    ])
  })

  it('normalizes the documented numeric weight without losing the live decimal-string representation', () => {
    expect(parseCredentialSchemasResponse({ schemas: [{ ...schema, weight: 4 }] })[0].weight).toBe('4')
  })

  it('rejects a non-canonical weight', () => {
    expect(() => parseCredentialSchemasResponse({ schemas: [{ ...schema, weight: '4.0' }] })).toThrow(
      'schemas[0].weight'
    )
  })

  it('keeps the pricing asset for the join gate', () => {
    expect(
      parseCredentialSchemasResponse({ schemas: [{ ...schema, pricing_asset_type: 'TU', pricing_asset: 'tu' }] })[0]
    ).toMatchObject({ pricingAssetType: 'TU', pricingAsset: 'tu' })
  })

  it('reads a missing pricing asset as unset instead of failing the list', () => {
    const [unpriced, priced] = parseCredentialSchemasResponse({
      schemas: [{ ...schema, pricing_asset_type: undefined, pricing_asset: undefined }, schema],
    })
    expect(unpriced).toMatchObject({ pricingAssetType: null, pricingAsset: null })
    expect(priced).toMatchObject({ pricingAssetType: 'COIN', pricingAsset: 'uvna' })
    expect(() => parseCredentialSchemasResponse({ schemas: [{ ...schema, pricing_asset: 42 }] })).toThrow(
      'schemas[0].pricing_asset'
    )
  })

  it('rejects malformed required periods', () => {
    expect(() =>
      parseCredentialSchemasResponse({
        schemas: [{ ...schema, holder_validation_validity_period: undefined }],
      })
    ).toThrow('schemas[0].holder_validation_validity_period')
  })
})

describe('ecosystemSchemasUrl', () => {
  it('asks for one keyset page of the non-archived schemas of an ecosystem', () => {
    expect(ecosystemSchemasUrl('https://indexer/v4/credential-schema', '7', 12)).toBe(
      'https://indexer/v4/credential-schema/list?ecosystem_id=7&archived=false&limit=13&sort=-id'
    )
  })

  it('carries the cursor into the next page of the same ecosystem', () => {
    const url = ecosystemSchemasUrl('https://indexer/v4/credential-schema', '7', 12, '30')
    expect(url).toContain('ecosystem_id=7')
    expect(url).toContain('max_id=30')
  })
})
