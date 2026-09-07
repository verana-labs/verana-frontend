import { describe, expect, it } from 'vitest'
import { parseCredentialSchemasResponse } from './useCredentialSchemas'

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

  it('rejects malformed required periods', () => {
    expect(() =>
      parseCredentialSchemasResponse({
        schemas: [{ ...schema, holder_validation_validity_period: undefined }],
      })
    ).toThrow('schemas[0].holder_validation_validity_period')
  })
})
