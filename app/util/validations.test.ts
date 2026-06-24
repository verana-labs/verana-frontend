import { describe, expect, it } from 'vitest'
import type { DataField } from '@/ui/dataview/types'
import {
  getErrorMessage,
  isValidCountryCode,
  isValidDID,
  isValidField,
  isValidHttpUrl,
  isValidLanguageTag,
} from '@/util/validations'

const dataField = (
  overrides: Partial<DataField<Record<string, unknown>>> = {}
): DataField<Record<string, unknown>> => ({
  type: 'data',
  name: 'value',
  label: 'Field',
  ...overrides,
})

describe('isValidDID', () => {
  it('accepts well-formed DIDs', () => {
    expect(isValidDID('did:example:123')).toBe(true)
    expect(isValidDID('did:web:example.com')).toBe(true)
    expect(isValidDID('did:cheqd:mainnet:zABC-123')).toBe(true)
  })

  it('rejects malformed DIDs', () => {
    expect(isValidDID('')).toBe(false)
    expect(isValidDID('did:example')).toBe(false)
    expect(isValidDID('not-a-did')).toBe(false)
    expect(isValidDID('did::123')).toBe(false)
  })
})

describe('isValidLanguageTag', () => {
  it('accepts two-letter lowercase tags', () => {
    expect(isValidLanguageTag('en')).toBe(true)
    expect(isValidLanguageTag('es')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isValidLanguageTag('EN')).toBe(false)
    expect(isValidLanguageTag('eng')).toBe(false)
    expect(isValidLanguageTag('e')).toBe(false)
    expect(isValidLanguageTag('en-US')).toBe(false)
  })
})

describe('isValidHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true)
    expect(isValidHttpUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('rejects non-http(s) schemes and junk', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false)
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isValidHttpUrl('did:web:example.com')).toBe(false)
    expect(isValidHttpUrl('example.com')).toBe(false)
    expect(isValidHttpUrl('')).toBe(false)
  })
})

describe('isValidCountryCode', () => {
  it('accepts ISO 3166-1 alpha-2 codes', () => {
    expect(isValidCountryCode('US')).toBe(true)
    expect(isValidCountryCode('FR')).toBe(true)
  })

  it('rejects lowercase or wrong length', () => {
    expect(isValidCountryCode('us')).toBe(false)
    expect(isValidCountryCode('USA')).toBe(false)
    expect(isValidCountryCode('U')).toBe(false)
  })
})

describe('isValidField', () => {
  it('treats empty values as valid only when the field is optional', () => {
    expect(isValidField(dataField({ required: false }), '')).toBe(true)
    expect(isValidField(dataField({ required: true }), '')).toBe(false)
    expect(isValidField(dataField({ required: true }), undefined)).toBe(false)
    expect(isValidField(dataField({ required: true }), '   ')).toBe(false)
  })

  it('validates URL fields with length bounds', () => {
    const field = dataField({ validation: { type: 'URL', maxLength: 20 } })
    expect(isValidField(field, 'https://ok.com')).toBe(true)
    expect(isValidField(field, 'ftp://nope.com')).toBe(false)
    expect(isValidField(field, 'https://this-url-is-way-too-long.example.com')).toBe(false)
  })

  it('validates numeric ranges', () => {
    const field = dataField({ validation: { type: 'Number', greaterThan: 0, lessThanOrEqual: 10 } })
    expect(isValidField(field, 5)).toBe(true)
    expect(isValidField(field, '5')).toBe(true)
    expect(isValidField(field, 0)).toBe(false)
    expect(isValidField(field, 11)).toBe(false)
    expect(isValidField(field, 'abc')).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('falls back to required vs invalid when no validation', () => {
    expect(getErrorMessage(dataField({ required: true }))).toBe('Required')
    expect(getErrorMessage(dataField({ required: false }))).toBe('Invalid value')
  })

  it('describes URL and number constraints', () => {
    expect(getErrorMessage(dataField({ validation: { type: 'URL' } }))).toBe('Enter a valid URL.')
    expect(getErrorMessage(dataField({ validation: { type: 'Number', greaterThanOrEqual: 1 } }))).toContain('>= 1')
  })
})
