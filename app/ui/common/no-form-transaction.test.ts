import { describe, expect, it } from 'vitest'
import { getBalanceWarningState, shouldStartNoFormSimulation } from './no-form-transaction'

describe('no-form transaction readiness', () => {
  it('waits for the real account balance before simulating', () => {
    expect(shouldStartNoFormSimulation(true, null, false)).toBe(false)
    expect(shouldStartNoFormSimulation(true, 884_664_036, false)).toBe(true)
  })

  it('starts only once and only for a no-form action', () => {
    expect(shouldStartNoFormSimulation(false, 884_664_036, false)).toBe(false)
    expect(shouldStartNoFormSimulation(true, 884_664_036, true)).toBe(false)
  })

  it('treats a zero balance as loaded and insufficient', () => {
    const state = getBalanceWarningState('0', 900_000, '1000000')

    expect(state).toEqual({
      availableBalance: 0,
      lowBalance: true,
      balanceLessThanFee: true,
    })
    expect(shouldStartNoFormSimulation(true, state.availableBalance, false)).toBe(true)
  })

  it('does not decide fee sufficiency until simulation returns a fee', () => {
    expect(getBalanceWarningState('884664036', null, '1000000')).toEqual({
      availableBalance: 884_664_036,
      lowBalance: false,
      balanceLessThanFee: null,
    })
  })

  it('allows an adequately funded transaction after simulation', () => {
    expect(getBalanceWarningState('884664036', 900_000, '1000000')).toEqual({
      availableBalance: 884_664_036,
      lowBalance: false,
      balanceLessThanFee: false,
    })
  })
})
