import { describe, expect, it } from 'vitest'
import {
  extractTxHeight,
  isAminoOnlySigner,
  isDirectSigner,
  stripZerosUndefinedAndEmptyStrings,
} from '@/msg/util/signerUtil'

const noop = () => undefined

describe('isDirectSigner', () => {
  it('accepts a signer exposing signDirect', () => {
    expect(isDirectSigner({ signDirect: noop })).toBe(true)
  })

  it('accepts a direct+amino signer (signDirect still present)', () => {
    expect(isDirectSigner({ signDirect: noop, signAmino: noop })).toBe(true)
  })

  it('rejects an amino-only signer', () => {
    expect(isDirectSigner({ signAmino: noop })).toBe(false)
  })

  it('rejects when signDirect is present but not a function', () => {
    expect(isDirectSigner({ signDirect: 'nope' })).toBe(false)
    expect(isDirectSigner({ signDirect: {} })).toBe(false)
  })

  it('rejects nullish and primitive inputs', () => {
    expect(isDirectSigner(null)).toBe(false)
    expect(isDirectSigner(undefined)).toBe(false)
    expect(isDirectSigner(0)).toBe(false)
    expect(isDirectSigner('signDirect')).toBe(false)
  })

  it('rejects an empty object', () => {
    expect(isDirectSigner({})).toBe(false)
  })
})

describe('isAminoOnlySigner', () => {
  it('accepts a signer with signAmino and no signDirect', () => {
    expect(isAminoOnlySigner({ signAmino: noop })).toBe(true)
  })

  it('rejects a signer that also exposes signDirect', () => {
    expect(isAminoOnlySigner({ signAmino: noop, signDirect: noop })).toBe(false)
  })

  it('rejects a direct-only signer', () => {
    expect(isAminoOnlySigner({ signDirect: noop })).toBe(false)
  })

  it('rejects when signAmino is present but not a function', () => {
    expect(isAminoOnlySigner({ signAmino: 42 })).toBe(false)
  })

  it('treats a non-function signDirect as absent, so amino-only still holds', () => {
    expect(isAminoOnlySigner({ signAmino: noop, signDirect: 'not-a-fn' })).toBe(true)
  })

  it('rejects nullish and empty inputs', () => {
    expect(isAminoOnlySigner(null)).toBe(false)
    expect(isAminoOnlySigner(undefined)).toBe(false)
    expect(isAminoOnlySigner({})).toBe(false)
  })
})

describe('stripZerosUndefinedAndEmptyStrings', () => {
  it('removes undefined, null, empty string, "0", and numeric 0', () => {
    const input = {
      keepStr: 'value',
      keepNum: 7,
      empty: '',
      stringZero: '0',
      numberZero: 0,
      undef: undefined,
      nul: null,
    }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({ keepStr: 'value', keepNum: 7 })
  })

  it('keeps falsy-but-meaningful values false and negative/positive non-zero numbers', () => {
    const input = { flag: false, negative: -1, positive: 1, spaceString: ' ' }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({
      flag: false,
      negative: -1,
      positive: 1,
      spaceString: ' ',
    })
  })

  it('drops zero Long-like objects but keeps non-zero ones', () => {
    const input = {
      zeroLong: { low: 0, high: 0, unsigned: false },
      nonZeroLow: { low: 5, high: 0 },
      nonZeroHigh: { low: 0, high: 3 },
    }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({
      nonZeroLow: { low: 5 },
      nonZeroHigh: { high: 3 },
    })
  })

  it('recurses into nested objects and prunes those that become empty', () => {
    const input = {
      outer: {
        keep: 'x',
        inner: { empty: '', zero: 0 },
      },
    }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({ outer: { keep: 'x' } })
  })

  it('cleans arrays and removes elements that reduce to undefined', () => {
    const input = { list: ['a', '', '0', 0, 'b', null, undefined] }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({ list: ['a', 'b'] })
  })

  it('drops an array that becomes empty after cleaning', () => {
    const input = { list: ['', 0, null] }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({})
  })

  it('preserves Date instances untouched', () => {
    const date = new Date('2026-01-01T00:00:00.000Z')
    const result = stripZerosUndefinedAndEmptyStrings({ when: date })
    expect(result).toEqual({ when: date })
    expect(result.when).toBeInstanceOf(Date)
    expect(result.when.getTime()).toBe(date.getTime())
  })

  it('returns an empty object when the whole input cleans away', () => {
    expect(stripZerosUndefinedAndEmptyStrings({ a: '', b: 0, c: null })).toEqual({})
  })

  it('returns an empty object for nullish top-level input', () => {
    expect(stripZerosUndefinedAndEmptyStrings(undefined)).toEqual({})
    expect(stripZerosUndefinedAndEmptyStrings(null)).toEqual({})
  })

  it('handles deeply nested mixed structures', () => {
    const input = {
      msg: {
        amount: [
          { denom: 'uvna', amount: '100' },
          { denom: '', amount: '0' },
        ],
        gas: { low: 0, high: 0 },
        memo: '',
        valid: true,
      },
    }
    expect(stripZerosUndefinedAndEmptyStrings(input)).toEqual({
      msg: {
        amount: [{ denom: 'uvna', amount: '100' }],
        valid: true,
      },
    })
  })
})

describe('extractTxHeight', () => {
  it('returns the numeric height as-is', () => {
    expect(extractTxHeight({ height: 1234 } as never)).toBe(1234)
  })

  it('parses a numeric string height', () => {
    expect(extractTxHeight({ height: ' 42 ' } as never)).toBe(42)
  })

  it('returns 0 when the height is genuinely zero', () => {
    expect(extractTxHeight({ height: 0 } as never)).toBe(0)
  })

  it('returns undefined for a missing or non-numeric height', () => {
    expect(extractTxHeight({ height: null } as never)).toBeUndefined()
    expect(extractTxHeight({ height: 'abc' } as never)).toBeUndefined()
    expect(extractTxHeight({} as never)).toBeUndefined()
  })

  it('returns undefined when the response itself is nullish', () => {
    expect(extractTxHeight(null as never)).toBeUndefined()
    expect(extractTxHeight(undefined as never)).toBeUndefined()
  })
})
