import { MsgStoreDigest } from '@verana-labs/verana-types/codec/verana/di/v1/tx'
import { describe, expect, it } from 'vitest'
import { buildStoreDigestMessage } from './actionDigest'

describe('buildStoreDigestMessage', () => {
  it('maps the corporation policy to the dev.25 authority field', () => {
    const message = buildStoreDigestMessage('sha384-example', {
      corporation: 'verana1policy',
      operator: 'verana1operator',
    })
    const value = MsgStoreDigest.decode(MsgStoreDigest.encode(message.value as MsgStoreDigest).finish())

    expect(message.typeUrl).toBe('/verana.di.v1.MsgStoreDigest')
    expect(value).toMatchObject({
      authority: 'verana1policy',
      operator: 'verana1operator',
      digest: 'sha384-example',
    })
  })
})
