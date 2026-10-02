import { describe, expect, it } from 'vitest'
import { expectedSequence, isSequenceMismatch } from './sequence-mismatch'

const CHECK_TX =
  'Broadcasting transaction failed with code 32 (codespace: sdk). Log: account sequence mismatch, expected 5, got 3: incorrect account sequence'

describe('isSequenceMismatch', () => {
  it('recognises the mismatch in an error, an error-like object and a string', () => {
    expect(isSequenceMismatch(new Error(CHECK_TX))).toBe(true)
    expect(isSequenceMismatch({ message: 'incorrect account sequence' })).toBe(true)
    expect(isSequenceMismatch('account sequence mismatch')).toBe(true)
  })

  it('ignores any other error', () => {
    expect(isSequenceMismatch(new Error('insufficient fees'))).toBe(false)
    expect(isSequenceMismatch(null)).toBe(false)
  })
})

describe('expectedSequence', () => {
  it('reads the sequence the chain expects', () => {
    expect(expectedSequence(new Error(CHECK_TX))).toBe(5)
  })

  it('returns undefined when the error does not carry it', () => {
    expect(expectedSequence(new Error('account sequence mismatch'))).toBeUndefined()
  })
})
