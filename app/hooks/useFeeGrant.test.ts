import { describe, expect, it } from 'vitest'
import { feeGrantsUrl } from './useFeeGrant'

describe('feeGrantsUrl', () => {
  it('filters on the acting corporation, the connected account and the message type', () => {
    expect(
      feeGrantsUrl('https://indexer.example/v4/delegation', {
        corporationId: 12,
        grantee: 'verana1me',
        msgType: '/verana.ec.v1.MsgCreateEcosystem',
      })
    ).toBe(
      'https://indexer.example/v4/delegation/fee-grants?grantor_corporation_id=12&grantee=verana1me&msg_type=%2Fverana.ec.v1.MsgCreateEcosystem&only_active=true'
    )
  })
})
