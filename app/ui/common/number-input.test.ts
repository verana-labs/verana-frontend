import { describe, expect, it } from 'vitest'
import { numberInputText } from '@/ui/common/number-input'

describe('numberInputText', () => {
  it('keeps the trailing zeros of a decimal still being typed', () => {
    expect(numberInputText('0.0', 0)).toBe('0.0')
    expect(numberInputText('1.50', 1.5)).toBe('1.50')
  })

  it('shows the form value once it no longer matches what was typed', () => {
    expect(numberInputText('0.0', 5)).toBe('5')
    expect(numberInputText('', 5)).toBe('5')
  })

  it('stays empty when the form has no value', () => {
    expect(numberInputText('', '')).toBe('')
    expect(numberInputText('', undefined)).toBe('')
  })
})
