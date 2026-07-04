import type { EncodeObject } from '@cosmjs/proto-signing'
import { describe, expect, it } from 'vitest'
import { sanitizeProtoMsg } from '@/msg/util/sanitizeProtoMsg'

const U32_FIELDS = [
  'issuerGrantorValidationValidityPeriod',
  'verifierGrantorValidationValidityPeriod',
  'issuerValidationValidityPeriod',
  'verifierValidationValidityPeriod',
  'holderValidationValidityPeriod',
] as const

const msg = (value: Record<string, unknown>, typeUrl = '/verana.cs.v1.MsgCreateCredentialSchema'): EncodeObject => ({
  typeUrl,
  value,
})

describe('sanitizeProtoMsg', () => {
  it('preserves the original typeUrl', () => {
    const result = sanitizeProtoMsg(msg({ tr_id: '1' }, '/some.custom.TypeUrl'))
    expect(result.typeUrl).toBe('/some.custom.TypeUrl')
  })

  it('keeps non-validity-period fields untouched', () => {
    const value = {
      tr_id: '42',
      schema: '{"json":true}',
      creator: 'verana1abc',
      isActive: false,
      count: 0,
    }
    const result = sanitizeProtoMsg(msg(value))
    expect(result.value).toEqual(value)
  })

  it('does not mutate the input message value', () => {
    const value = { holderValidationValidityPeriod: 0, tr_id: '1' }
    const original = msg(value)
    sanitizeProtoMsg(original)
    expect(original.value).toEqual({ holderValidationValidityPeriod: 0, tr_id: '1' })
  })

  describe('present positive uint fields', () => {
    it('keeps a positive numeric validity period as a number', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: 365 }))
      expect(result.value).toEqual({ issuerValidationValidityPeriod: 365 })
    })

    it('coerces a numeric string to a number', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: '365' }))
      expect((result.value as Record<string, unknown>).issuerValidationValidityPeriod).toBe(365)
    })

    it('truncates a non-integer to uint32 via >>> 0', () => {
      const result = sanitizeProtoMsg(msg({ holderValidationValidityPeriod: 12.9 }))
      expect((result.value as Record<string, unknown>).holderValidationValidityPeriod).toBe(12)
    })

    it('keeps the maximum uint32 value', () => {
      const result = sanitizeProtoMsg(msg({ verifierValidationValidityPeriod: 4294967295 }))
      expect((result.value as Record<string, unknown>).verifierValidationValidityPeriod).toBe(4294967295)
    })

    it('omits a value exactly one above uint32 max because >>> 0 wraps it to zero', () => {
      const result = sanitizeProtoMsg(msg({ verifierValidationValidityPeriod: 4294967296, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })
  })

  describe('omitted (zero / blank / invalid) uint fields', () => {
    it('omits a zero number', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: 0, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits the string "0"', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: '0', tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits an empty string', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: '', tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits a whitespace-only string', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: '   ', tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits undefined', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: undefined, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits null', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: null, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits a negative number', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: -5, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits NaN', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: Number.NaN, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits Infinity', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: Number.POSITIVE_INFINITY, tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })

    it('omits a non-numeric string', () => {
      const result = sanitizeProtoMsg(msg({ issuerValidationValidityPeriod: 'abc', tr_id: '1' }))
      expect(result.value).toEqual({ tr_id: '1' })
    })
  })

  it('applies the rule to every known uint field independently', () => {
    const value: Record<string, unknown> = {}
    for (const field of U32_FIELDS) {
      value[field] = 0
    }
    value.issuerValidationValidityPeriod = 30
    value.tr_id = '7'

    const result = sanitizeProtoMsg(msg(value)).value as Record<string, unknown>
    expect(result).toEqual({ issuerValidationValidityPeriod: 30, tr_id: '7' })
  })

  it('handles a realistic mixed payload', () => {
    const value = {
      tr_id: '12',
      issuerGrantorValidationValidityPeriod: '180',
      verifierGrantorValidationValidityPeriod: 0,
      issuerValidationValidityPeriod: '',
      verifierValidationValidityPeriod: 90,
      holderValidationValidityPeriod: null,
      json_schema: '{"$schema":"x"}',
    }
    const result = sanitizeProtoMsg(msg(value)).value as Record<string, unknown>
    expect(result).toEqual({
      tr_id: '12',
      issuerGrantorValidationValidityPeriod: 180,
      verifierValidationValidityPeriod: 90,
      json_schema: '{"$schema":"x"}',
    })
  })

  it('returns an empty value object when every field is omitted', () => {
    const value = {
      issuerGrantorValidationValidityPeriod: 0,
      holderValidationValidityPeriod: '',
    }
    const result = sanitizeProtoMsg(msg(value))
    expect(result.value).toEqual({})
  })

  it('passes through an already-empty value object', () => {
    const result = sanitizeProtoMsg(msg({}))
    expect(result.value).toEqual({})
  })
})
