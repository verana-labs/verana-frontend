import {
  MsgReclaimTrustDepositYield,
  MsgRepaySlashedTrustDeposit,
} from '@verana-labs/verana-types/codec/verana/td/v1/tx'
import { describe, expect, it } from 'vitest'
import { buildTrustDepositMessage } from './actionTrustDeposit'

const context = { corporation: 'verana1policy', operator: 'verana1operator' }

describe('buildTrustDepositMessage', () => {
  it('round-trips the V4 yield-reclaim contract', () => {
    const message = buildTrustDepositMessage({ msgType: 'MsgReclaimTrustDepositYield' }, context)
    const value = MsgReclaimTrustDepositYield.decode(
      MsgReclaimTrustDepositYield.encode(message.value as MsgReclaimTrustDepositYield).finish()
    )

    expect(message.typeUrl).toBe('/verana.td.v1.MsgReclaimTrustDepositYield')
    expect(value).toMatchObject({ corporation: 'verana1policy', operator: 'verana1operator' })
  })

  it('round-trips the V4 slashed-deposit repayment contract', () => {
    const message = buildTrustDepositMessage({ msgType: 'MsgRepaySlashedTrustDeposit', deposit: '21' }, context)
    const value = MsgRepaySlashedTrustDeposit.decode(
      MsgRepaySlashedTrustDeposit.encode(message.value as MsgRepaySlashedTrustDeposit).finish()
    )

    expect(message.typeUrl).toBe('/verana.td.v1.MsgRepaySlashedTrustDeposit')
    expect(value).toEqual({ corporation: 'verana1policy', operator: 'verana1operator', deposit: 21 })
  })
})
