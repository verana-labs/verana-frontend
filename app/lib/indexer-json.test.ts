import { describe, expect, it } from 'vitest'
import { indexerValidators } from './indexer-json'

const {
  record,
  string,
  number,
  integer,
  scaledShare,
  decimalAmount,
  nullableString,
  nullableTimestamp,
  optionalString,
  stringArray,
} = indexerValidators('sample')

const rejected = (path: string) => `Invalid sample response: ${path}`

describe('indexerValidators', () => {
  it('record accepts plain objects and rejects null and arrays', () => {
    expect(record({ id: 1 }, 'response')).toEqual({ id: 1 })
    expect(() => record(null, 'response')).toThrow(rejected('response'))
    expect(() => record([], 'response')).toThrow(rejected('response'))
  })

  it('string accepts strings only', () => {
    expect(string('did:web:example.com', 'schema.did')).toBe('did:web:example.com')
    expect(() => string(undefined, 'schema.did')).toThrow(rejected('schema.did'))
  })

  it('number accepts any finite number and rejects NaN and numeric strings', () => {
    expect(number(-1.5, 'schema.id')).toBe(-1.5)
    expect(() => number(Number.NaN, 'schema.id')).toThrow(rejected('schema.id'))
    expect(() => number('1', 'schema.id')).toThrow(rejected('schema.id'))
  })

  it('integer accepts non-negative safe integers only', () => {
    expect(integer(0, 'deposit')).toBe(0)
    expect(() => integer(-1, 'deposit')).toThrow(rejected('deposit'))
    expect(() => integer(1.5, 'deposit')).toThrow(rejected('deposit'))
    expect(() => integer(Number.MAX_SAFE_INTEGER + 1, 'deposit')).toThrow(rejected('deposit'))
  })

  it('scaledShare accepts integers above MAX_SAFE_INTEGER but not fractions or negatives', () => {
    expect(scaledShare(Number.MAX_SAFE_INTEGER + 1, 'share')).toBe(Number.MAX_SAFE_INTEGER + 1)
    expect(() => scaledShare(0.5, 'share')).toThrow(rejected('share'))
    expect(() => scaledShare(-1, 'share')).toThrow(rejected('share'))
  })

  it('decimalAmount stringifies safe integers and accepts canonical numeric strings', () => {
    expect(decimalAmount(42, 'weight')).toBe('42')
    expect(decimalAmount('0', 'weight')).toBe('0')
    expect(decimalAmount('1230', 'weight')).toBe('1230')
    expect(() => decimalAmount('4.0', 'weight')).toThrow(rejected('weight'))
    expect(() => decimalAmount('007', 'weight')).toThrow(rejected('weight'))
    expect(() => decimalAmount(-1, 'weight')).toThrow(rejected('weight'))
  })

  it('nullableString passes null through and rejects undefined', () => {
    expect(nullableString(null, 'archived')).toBeNull()
    expect(nullableString('2026-01-01', 'archived')).toBe('2026-01-01')
    expect(() => nullableString(undefined, 'archived')).toThrow(rejected('archived'))
  })

  it('nullableTimestamp passes null through and rejects numbers', () => {
    expect(nullableTimestamp(null, 'last_slashed')).toBeNull()
    expect(nullableTimestamp('2026-01-01T00:00:00Z', 'last_slashed')).toBe('2026-01-01T00:00:00Z')
    expect(() => nullableTimestamp(1_700_000_000, 'last_slashed')).toThrow(rejected('last_slashed'))
  })

  it('optionalString passes undefined through and rejects null', () => {
    expect(optionalString(undefined, 'created')).toBeUndefined()
    expect(optionalString('2026-01-01', 'created')).toBe('2026-01-01')
    expect(() => optionalString(null, 'created')).toThrow(rejected('created'))
  })

  it('stringArray accepts empty and all-string arrays and rejects anything else', () => {
    expect(stringArray([], 'msg_types')).toEqual([])
    expect(stringArray(['a', 'b'], 'msg_types')).toEqual(['a', 'b'])
    expect(() => stringArray(['a', 1], 'msg_types')).toThrow(rejected('msg_types'))
    expect(() => stringArray('a', 'msg_types')).toThrow(rejected('msg_types'))
  })
})
