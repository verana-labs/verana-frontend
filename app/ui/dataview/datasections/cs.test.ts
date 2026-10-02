import { describe, expect, it } from 'vitest'
import { protocolParamsInitialState } from '@/lib/protocolParams'
import { boundedCredentialSchemaSections } from './cs'

function validityValidation(params: typeof protocolParamsInitialState) {
  const fields = boundedCredentialSchemaSections(params).flatMap((section) => section.fields ?? [])
  return Object.fromEntries(
    fields
      .filter((field) => String(field.name).endsWith('ValidationValidityPeriod'))
      .map((field) => [field.name, 'validation' in field ? field.validation : undefined])
  )
}

describe('boundedCredentialSchemaSections', () => {
  it('caps each validity period with its module parameter', () => {
    const bounds = validityValidation({
      ...protocolParamsInitialState,
      issuerGrantorValidityMaxDays: 3650,
      verifierGrantorValidityMaxDays: 3650,
      issuerValidityMaxDays: 1825,
      verifierValidityMaxDays: 1825,
      holderValidityMaxDays: 365,
    })
    expect(bounds.holderValidationValidityPeriod).toEqual({ type: 'Long', greaterThanOrEqual: 0, lessThanOrEqual: 365 })
    expect(bounds.issuerValidationValidityPeriod).toEqual({
      type: 'Long',
      greaterThanOrEqual: 0,
      lessThanOrEqual: 1825,
    })
    expect(Object.keys(bounds)).toHaveLength(5)
  })

  it('keeps only the lower bound when a parameter is unknown', () => {
    expect(validityValidation(protocolParamsInitialState).holderValidationValidityPeriod).toEqual({
      type: 'Long',
      greaterThanOrEqual: 0,
    })
  })
})
