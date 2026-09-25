import { describe, expect, it } from 'vitest'
import { applyKeysetParams, indexerValidators, takeKeysetPage } from './indexer-json'

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

describe('applyKeysetParams', () => {
  it('asks for one row more than the page and sorts newest-first by default', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 9 })
    expect(params.toString()).toBe('limit=10&sort=-id')
  })

  it('keeps the parameters the caller already set', () => {
    const params = new URLSearchParams({ trust_data: 'full', archived: 'false' })
    applyKeysetParams(params, { pageSize: 5 })
    expect(params.get('trust_data')).toBe('full')
    expect(params.get('archived')).toBe('false')
    expect(params.get('limit')).toBe('6')
  })

  it('passes the last id verbatim as the descending cursor, because max_id excludes it', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 9, after: '24' })
    expect(params.get('max_id')).toBe('24')
    expect(params.get('min_id')).toBeNull()
  })

  it('advances the last id by one as the ascending cursor, because min_id includes it', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 25, after: '20', sort: '+id' })
    expect(params.get('min_id')).toBe('21')
    expect(params.get('max_id')).toBeNull()
    expect(params.get('sort')).toBe('+id')
  })

  it('advances an id above the safe integer range without losing precision', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 25, after: '9007199254740993', sort: '+id' })
    expect(params.get('min_id')).toBe('9007199254740994')
  })
})

describe('takeKeysetPage', () => {
  it('reports a next page and drops the extra row', () => {
    expect(takeKeysetPage([1, 2, 3, 4], 3)).toEqual({ items: [1, 2, 3], hasNext: true })
  })

  it('reports no next page when the window holds the page exactly', () => {
    expect(takeKeysetPage([1, 2, 3], 3)).toEqual({ items: [1, 2, 3], hasNext: false })
  })

  it('reports no next page for an empty window', () => {
    expect(takeKeysetPage([], 3)).toEqual({ items: [], hasNext: false })
  })
})
