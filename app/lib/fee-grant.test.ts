import { describe, expect, it } from 'vitest'
import { type FeeGrant, feeGrantCovering, nativeFeeAmount, parseFeeGrants } from './fee-grant'

const CREATE = '/verana.ec.v1.MsgCreateEcosystem'

function grant(overrides: Partial<FeeGrant> = {}): FeeGrant {
  return { msgTypes: [CREATE], spendLimit: null, remainingSpend: null, expiration: null, ...overrides }
}

describe('parseFeeGrants', () => {
  it('reads the indexer envelope', () => {
    expect(
      parseFeeGrants({
        fee_grants: [
          {
            id: 3,
            grantor_corporation_id: 12,
            grantee: 'verana1me',
            msg_types: [CREATE],
            spend_limit: [{ denom: 'uvna', amount: '1000000' }],
            remaining_spend: [{ denom: 'uvna', amount: '400000' }],
            expiration: '2027-01-01T00:00:00Z',
          },
        ],
      })
    ).toEqual([
      {
        msgTypes: [CREATE],
        spendLimit: [{ denom: 'uvna', amount: '1000000' }],
        remainingSpend: [{ denom: 'uvna', amount: '400000' }],
        expiration: '2027-01-01T00:00:00Z',
      },
    ])
  })

  it('reads an unlimited grant as one without a spend limit', () => {
    expect(parseFeeGrants({ fee_grants: [{ msg_types: [CREATE] }] })).toEqual([grant()])
    expect(parseFeeGrants({ fee_grants: [{ msg_types: [CREATE], spend_limit: [] }] })).toEqual([grant()])
  })

  it('is empty on a missing, malformed or error payload', () => {
    expect(parseFeeGrants(undefined)).toEqual([])
    expect(parseFeeGrants({ error: 'relation "fee_grants" does not exist', code: 500 })).toEqual([])
    expect(parseFeeGrants({ fee_grants: 'nope' })).toEqual([])
    expect(parseFeeGrants([{ msg_types: [CREATE] }])).toEqual([])
  })

  it('drops malformed entries and fields instead of throwing', () => {
    expect(
      parseFeeGrants({
        fee_grants: [
          null,
          { msg_types: [CREATE, 7], spend_limit: [{ denom: 'uvna' }, 'nope'], expiration: 12 },
          { msg_types: 'nope' },
        ],
      })
    ).toEqual([grant(), grant({ msgTypes: [] })])
  })
})

describe('nativeFeeAmount', () => {
  it('takes the native coin of the simulated fee', () => {
    expect(nativeFeeAmount({ amount: [{ denom: 'uvna', amount: '90000' }], gas: '300000' })).toBe('90000')
  })

  it('is zero when the fee carries no native coin', () => {
    expect(nativeFeeAmount({ amount: [], gas: '300000' })).toBe('0')
  })
})

describe('feeGrantCovering', () => {
  it('covers every message type when the grant lists none', () => {
    const grant = { msgTypes: [], spendLimit: null, remainingSpend: null, expiration: null }
    expect(feeGrantCovering([grant], '/verana.ec.v1.MsgCreateEcosystem', '1000')).toBe(grant)
  })
  it('covers any fee with an unlimited grant', () => {
    expect(feeGrantCovering([grant()], CREATE, '90000')).toEqual(grant())
  })

  it('covers a fee within the remaining spend', () => {
    const limited = grant({
      spendLimit: [{ denom: 'uvna', amount: '1000000' }],
      remainingSpend: [{ denom: 'uvna', amount: '90000' }],
    })
    expect(feeGrantCovering([limited], CREATE, '90000')).toEqual(limited)
    expect(feeGrantCovering([limited], CREATE, '90001')).toBeNull()
  })

  it('compares amounts beyond the safe integer range', () => {
    const huge = grant({
      spendLimit: [{ denom: 'uvna', amount: '99999999999999999999' }],
      remainingSpend: [{ denom: 'uvna', amount: '99999999999999999999' }],
    })
    expect(feeGrantCovering([huge], CREATE, '99999999999999999998')).toEqual(huge)
    expect(feeGrantCovering([huge], CREATE, '999999999999999999999')).toBeNull()
  })

  it('refuses a limited grant with no remaining spend in the native denom', () => {
    const other = grant({
      spendLimit: [{ denom: 'uatom', amount: '10' }],
      remainingSpend: [{ denom: 'uatom', amount: '10' }],
    })
    expect(feeGrantCovering([other], CREATE, '1')).toBeNull()
    expect(feeGrantCovering([grant({ spendLimit: [{ denom: 'uvna', amount: '10' }] })], CREATE, '1')).toBeNull()
  })

  it('refuses a limited grant when the fee is not a plain amount', () => {
    const limited = grant({
      spendLimit: [{ denom: 'uvna', amount: '10' }],
      remainingSpend: [{ denom: 'uvna', amount: '10' }],
    })
    expect(feeGrantCovering([limited], CREATE, '1.5')).toBeNull()
    expect(feeGrantCovering([grant()], CREATE, '1.5')).toEqual(grant())
  })

  it('ignores grants that do not carry the message type', () => {
    expect(feeGrantCovering([grant({ msgTypes: ['/verana.ec.v1.MsgUpdateEcosystem'] })], CREATE, '1')).toBeNull()
    expect(feeGrantCovering([], CREATE, '1')).toBeNull()
  })

  it('ignores an expired grant', () => {
    const now = Date.parse('2026-09-10T00:00:00Z')
    expect(feeGrantCovering([grant({ expiration: '2026-09-09T00:00:00Z' })], CREATE, '1', now)).toBeNull()
    expect(feeGrantCovering([grant({ expiration: '2026-09-11T00:00:00Z' })], CREATE, '1', now)).not.toBeNull()
    expect(feeGrantCovering([grant({ expiration: 'not a date' })], CREATE, '1', now)).not.toBeNull()
  })
})
