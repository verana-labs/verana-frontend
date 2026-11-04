import { describe, expect, it } from 'vitest'
import { veranaAmino } from '@/config/veranaChain.sign.client'
import { buildSendMsg } from './actionSend'

const FROM = 'verana1h5m6c6a33kncyrm05rz4k4lj9u2q2t2dkzrnts'
const TO = 'verana1f6fyc0ptxh7padqr3hnrw6sm8wjfr93w6cgv39jwm00nd6kh08esdak22l'

describe('buildSendMsg', () => {
  it('sends the uvna amount from the connected account and survives the amino signer', () => {
    const message = buildSendMsg(FROM, TO, '1500000')
    expect(message.value).toEqual({ fromAddress: FROM, toAddress: TO, amount: [{ denom: 'uvna', amount: '1500000' }] })
    const amino = veranaAmino.toAmino(message)
    expect(amino.type).toBe('cosmos-sdk/MsgSend')
    expect(veranaAmino.fromAmino(amino)).toEqual(message)
  })
})
