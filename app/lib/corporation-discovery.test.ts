import { describe, expect, it } from 'vitest'
import { type CorporationMembership, chooseActingMembership, lostActingCorporation } from '@/lib/corporation-discovery'

function membership(id: number): CorporationMembership {
  return {
    corporation: { id, policyAddress: `verana1policy${id}`, did: `did:web:corp-${id}.example` },
    operator: true,
    member: false,
    weight: null,
    grantedMessageTypes: ['/verana.ec.v1.MsgCreateEcosystem'],
  }
}

describe('lostActingCorporation', () => {
  it('is null without a previous acting corporation', () => {
    expect(lostActingCorporation(null, [membership(12)], [])).toBeNull()
  })

  it('is null while the acting corporation is still discovered', () => {
    expect(lostActingCorporation(12, [membership(12)], [membership(12), membership(13)])).toBeNull()
  })

  it('returns the old corporation once discovery drops it', () => {
    expect(lostActingCorporation(12, [membership(12), membership(13)], [membership(13)])).toEqual(
      membership(12).corporation
    )
    expect(lostActingCorporation(12, [membership(12)], [])).toEqual(membership(12).corporation)
  })
})

describe('chooseActingMembership', () => {
  it('prefers the persisted corporation when it is still discovered', () => {
    expect(chooseActingMembership([membership(12), membership(13)], 13)).toEqual(membership(13))
  })

  it('auto-selects a single membership and otherwise asks', () => {
    expect(chooseActingMembership([membership(12)], null)).toEqual(membership(12))
    expect(chooseActingMembership([membership(12), membership(13)], 99)).toBeNull()
    expect(chooseActingMembership([], 12)).toBeNull()
  })
})
