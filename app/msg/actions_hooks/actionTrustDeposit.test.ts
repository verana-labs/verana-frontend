import { MsgReclaimTrustDepositYield } from '@verana-labs/verana-types/codec/verana/td/v1/tx'
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
})
