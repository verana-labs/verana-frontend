import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { describe, expect, it } from 'vitest'
import {
  EMPTY_GRANT_OPTIONS_INPUT,
  type ExistingFeeGrant,
  existingFeeGrantFields,
  feeGrantFor,
  formatIndexerPeriod,
  GRANT_ISSUES,
  type GrantOptionsInput,
  grantOperatorAuthorization,
  grantOptionLines,
  NO_GRANT_OPTIONS,
  type OperatorGrantOptions,
  operatorGrantIssue,
  readGrantOptions,
  retargetGrantOptions,
  updateGrantOptions,
  uvnaToVna,
  vnaToUvna,
} from './operator-grant'

const NOW = Date.parse('2026-10-01T12:00:00Z')
const LATER = new Date('2026-12-01T00:00:00Z')
const DAY = 86_400
const PARTIES = {
  corporation: 'verana1policy',
  operator: 'verana1operator',
  grantee: 'verana1grantee',
  msgTypes: ['/verana.ec.v1.MsgCreateEcosystem'],
}

function roundTrip(options: OperatorGrantOptions): MsgGrantOperatorAuthorization {
  return MsgGrantOperatorAuthorization.decode(
    MsgGrantOperatorAuthorization.encode(grantOperatorAuthorization(PARTIES, options)).finish()
  )
}

function input(overrides: Partial<GrantOptionsInput>): GrantOptionsInput {
  return { ...EMPTY_GRANT_OPTIONS_INPUT, ...overrides }
}

describe('vnaToUvna', () => {
  it.each([
    ['5', '5000000'],
    ['1.5', '1500000'],
    ['0.000001', '1'],
    [' 2 ', '2000000'],
    ['12345678901234567890', '12345678901234567890000000'],
  ])('reads %s VNA as %s uvna', (text, uvna) => {
    expect(vnaToUvna(text)).toBe(uvna)
  })

  it.each(['', '0', '0.000000', '0.0000001', '-1', '1,5', '1e3', 'abc', '.5'])('rejects %j', (text) => {
    expect(vnaToUvna(text)).toBeNull()
  })
})

describe('grantOperatorAuthorization', () => {
  it('keeps the parties and leaves every option empty by default', () => {
    expect(roundTrip(NO_GRANT_OPTIONS)).toEqual({
      ...PARTIES,
      expiration: undefined,
      authzSpendLimit: [],
      authzSpendLimitPeriod: undefined,
      withFeegrant: false,
      feegrantSpendLimit: [],
      feegrantSpendLimitPeriod: undefined,
    })
  })

  it.each<[string, OperatorGrantOptions, Partial<MsgGrantOperatorAuthorization>]>([
    ['an expiration', { ...NO_GRANT_OPTIONS, expiration: LATER }, { expiration: LATER }],
    [
      'a spend limit without period',
      { ...NO_GRANT_OPTIONS, spendLimit: { amountUvna: '5000000', periodSeconds: null } },
      { authzSpendLimit: [{ denom: 'uvna', amount: '5000000' }], authzSpendLimitPeriod: undefined },
    ],
    [
      'a periodic spend limit',
      { ...NO_GRANT_OPTIONS, expiration: LATER, spendLimit: { amountUvna: '5000000', periodSeconds: 30 * DAY } },
      {
        expiration: LATER,
        authzSpendLimit: [{ denom: 'uvna', amount: '5000000' }],
        authzSpendLimitPeriod: { seconds: 30 * DAY, nanos: 0 },
      },
    ],
    [
      'an unlimited fee grant',
      { ...NO_GRANT_OPTIONS, feeGrant: { spendLimit: null } },
      { withFeegrant: true, feegrantSpendLimit: [], feegrantSpendLimitPeriod: undefined },
    ],
    [
      'a capped fee grant',
      { ...NO_GRANT_OPTIONS, feeGrant: { spendLimit: { amountUvna: '2000000', periodSeconds: null } } },
      { withFeegrant: true, feegrantSpendLimit: [{ denom: 'uvna', amount: '2000000' }] },
    ],
    [
      'every option at once',
      {
        expiration: LATER,
        spendLimit: { amountUvna: '5000000', periodSeconds: 30 * DAY },
        feeGrant: { spendLimit: { amountUvna: '2000000', periodSeconds: 7 * DAY } },
      },
      {
        expiration: LATER,
        authzSpendLimit: [{ denom: 'uvna', amount: '5000000' }],
        authzSpendLimitPeriod: { seconds: 30 * DAY, nanos: 0 },
        withFeegrant: true,
        feegrantSpendLimit: [{ denom: 'uvna', amount: '2000000' }],
        feegrantSpendLimitPeriod: { seconds: 7 * DAY, nanos: 0 },
      },
    ],
  ])('carries %s', (_name, options, expected) => {
    expect(operatorGrantIssue(options, NOW)).toBeNull()
    expect(roundTrip(options)).toEqual({
      ...roundTrip(NO_GRANT_OPTIONS),
      ...expected,
    })
  })
})

describe('operatorGrantIssue', () => {
  const limit = (periodSeconds: number | null, amountUvna = '1000000') => ({ amountUvna, periodSeconds })

  it.each<[string, OperatorGrantOptions, string]>([
    ['an expiration in the past', { ...NO_GRANT_OPTIONS, expiration: new Date(NOW - 1) }, GRANT_ISSUES.expiration],
    ['an expiration at the block time', { ...NO_GRANT_OPTIONS, expiration: new Date(NOW) }, GRANT_ISSUES.expiration],
    ['a zero spend limit', { ...NO_GRANT_OPTIONS, spendLimit: limit(null, '0') }, GRANT_ISSUES.amount],
    ['a non-integer spend limit', { ...NO_GRANT_OPTIONS, spendLimit: limit(null, '1.5') }, GRANT_ISSUES.amount],
    [
      'a zero fee spend limit',
      { ...NO_GRANT_OPTIONS, feeGrant: { spendLimit: limit(null, '0') } },
      GRANT_ISSUES.amount,
    ],
    ['a zero period', { ...NO_GRANT_OPTIONS, expiration: LATER, spendLimit: limit(0) }, GRANT_ISSUES.period],
    ['a negative period', { ...NO_GRANT_OPTIONS, expiration: LATER, spendLimit: limit(-DAY) }, GRANT_ISSUES.period],
    [
      'a period past the Go duration range',
      { ...NO_GRANT_OPTIONS, expiration: LATER, spendLimit: limit(106_752 * DAY) },
      GRANT_ISSUES.period,
    ],
    [
      'a spend limit period without expiration',
      { ...NO_GRANT_OPTIONS, spendLimit: limit(DAY) },
      GRANT_ISSUES.periodNeedsExpiration,
    ],
    [
      'a fee spend limit period without expiration',
      { ...NO_GRANT_OPTIONS, feeGrant: { spendLimit: limit(DAY) } },
      GRANT_ISSUES.periodNeedsExpiration,
    ],
  ])('rejects %s', (_name, options, issue) => {
    expect(operatorGrantIssue(options, NOW)).toBe(issue)
  })

  it('accepts the longest period a Go duration holds', () => {
    expect(operatorGrantIssue({ ...NO_GRANT_OPTIONS, expiration: LATER, spendLimit: limit(106_751 * DAY) }, NOW)).toBe(
      null
    )
  })
})

describe('readGrantOptions', () => {
  it('reads an untouched form as no options', () => {
    expect(readGrantOptions(EMPTY_GRANT_OPTIONS_INPUT, NOW)).toEqual({ options: NO_GRANT_OPTIONS, issue: null })
  })

  it('converts VNA to uvna and days to seconds', () => {
    expect(
      readGrantOptions(
        {
          expiration: '2026-12-01T00:00',
          spendLimit: '5',
          spendPeriodDays: '30',
          withFeegrant: true,
          feeSpendLimit: '0.25',
          feePeriodDays: '7',
        },
        NOW
      )
    ).toEqual({
      options: {
        expiration: new Date('2026-12-01T00:00'),
        spendLimit: { amountUvna: '5000000', periodSeconds: 30 * DAY },
        feeGrant: { spendLimit: { amountUvna: '250000', periodSeconds: 7 * DAY } },
      },
      issue: null,
    })
  })

  it('ignores a period without its spend limit, like the chain', () => {
    expect(readGrantOptions(input({ spendPeriodDays: '30' }), NOW)).toEqual({
      options: NO_GRANT_OPTIONS,
      issue: null,
    })
  })

  it('ignores the fee inputs while the fee grant is off', () => {
    expect(readGrantOptions(input({ feeSpendLimit: 'nope', feePeriodDays: 'x' }), NOW)).toEqual({
      options: NO_GRANT_OPTIONS,
      issue: null,
    })
  })

  it.each<[string, Partial<GrantOptionsInput>, string]>([
    ['a malformed amount', { spendLimit: '1,5' }, GRANT_ISSUES.amount],
    ['a zero amount', { spendLimit: '0' }, GRANT_ISSUES.amount],
    ['fractional days', { spendLimit: '1', spendPeriodDays: '1.5' }, GRANT_ISSUES.period],
    ['zero days', { expiration: '2026-12-01T00:00', spendLimit: '1', spendPeriodDays: '0' }, GRANT_ISSUES.period],
    ['a past expiration', { expiration: '2026-01-01T00:00' }, GRANT_ISSUES.expiration],
    ['a malformed expiration', { expiration: 'soon' }, GRANT_ISSUES.expiration],
    ['a period without expiration', { spendLimit: '1', spendPeriodDays: '7' }, GRANT_ISSUES.periodNeedsExpiration],
    [
      'a fee period without expiration',
      { withFeegrant: true, feeSpendLimit: '1', feePeriodDays: '7' },
      GRANT_ISSUES.periodNeedsExpiration,
    ],
    ['a malformed fee amount', { withFeegrant: true, feeSpendLimit: 'abc' }, GRANT_ISSUES.amount],
  ])('reports %s', (_name, overrides, issue) => {
    expect(readGrantOptions(input(overrides), NOW)).toEqual({ options: null, issue })
  })
})

describe('grantOptionLines', () => {
  it('states that no fee grant is attached', () => {
    expect(grantOptionLines(NO_GRANT_OPTIONS, false)).toEqual([{ label: 'Grantee fee grant', value: 'None' }])
  })

  it('reads as a revoke when the grantee already holds a fee grant', () => {
    expect(grantOptionLines(NO_GRANT_OPTIONS, true)).toEqual([
      { label: 'Grantee fee grant', value: 'Revoked, the current fee grant is removed' },
    ])
  })

  it('describes the limits, the expiration and an unlimited fee grant', () => {
    const lines = grantOptionLines(
      {
        expiration: LATER,
        spendLimit: { amountUvna: '5000000', periodSeconds: 30 * DAY },
        feeGrant: { spendLimit: null },
      },
      true
    )
    expect(lines).toEqual([
      { label: 'Spend limit', value: '5 VNA every 30d' },
      { label: 'Expiration', value: LATER.toLocaleString() },
      { label: 'Grantee fee grant', value: 'Unlimited' },
    ])
  })

  it('describes a capped fee grant with its period', () => {
    const lines = grantOptionLines(
      {
        ...NO_GRANT_OPTIONS,
        feeGrant: { spendLimit: { amountUvna: '2000000', periodSeconds: 7 * DAY } },
      },
      false
    )
    expect(lines).toEqual([{ label: 'Grantee fee grant', value: '2 VNA every 7d' }])
  })
})

describe('formatIndexerPeriod', () => {
  it.each([
    ['86400s', '1d'],
    ['2592000s', '30d'],
    ['7200s', '2h'],
    ['300s', '5m'],
    ['90s', '90s'],
    ['1.5s', '1.5s'],
  ])('shows %s as %s', (value, shown) => {
    expect(formatIndexerPeriod(value)).toBe(shown)
  })
})

describe('uvnaToVna', () => {
  it.each([
    ['2000000', '2'],
    ['1250000', '1.25'],
    ['1', '0.000001'],
    ['0', '0'],
    ['12345678901234567890000000', '12345678901234567890'],
  ])('shows %s uvna as %s VNA', (uvna, vna) => {
    expect(uvnaToVna(uvna)).toBe(vna)
    if (uvna !== '0') expect(vnaToUvna(vna)).toBe(uvna)
  })
})

describe('updateGrantOptions', () => {
  it('clears a period once its spend limit is cleared, so the form shows what is sent', () => {
    const filled = input({ spendLimit: '5', spendPeriodDays: '30', feeSpendLimit: '2', feePeriodDays: '7' })
    expect(updateGrantOptions(filled, { spendLimit: '' })).toEqual({ ...filled, spendLimit: '', spendPeriodDays: '' })
    expect(updateGrantOptions(filled, { feeSpendLimit: ' ' })).toEqual({
      ...filled,
      feeSpendLimit: ' ',
      feePeriodDays: '',
    })
    expect(updateGrantOptions(filled, { spendPeriodDays: '60' })).toEqual({ ...filled, spendPeriodDays: '60' })
  })
})

describe('existing fee grants', () => {
  const capped: ExistingFeeGrant = {
    grantee: 'verana1op',
    spendLimit: [{ denom: 'uvna', amount: '2000000' }],
    period: '604800s',
  }
  const unlimited: ExistingFeeGrant = { grantee: 'verana1other', spendLimit: null, period: null }

  it('finds the grant of the typed grantee only', () => {
    expect(feeGrantFor([capped, unlimited], 'verana1op')).toBe(capped)
    expect(feeGrantFor([capped, unlimited], 'verana1nobody')).toBeUndefined()
    expect(feeGrantFor([{ grantee: '' }], '')).toBeUndefined()
  })

  it('prefills the current limit and period, or an unlimited grant', () => {
    expect(existingFeeGrantFields(capped)).toEqual({ withFeegrant: true, feeSpendLimit: '2', feePeriodDays: '7' })
    expect(existingFeeGrantFields(unlimited)).toEqual({ withFeegrant: true, feeSpendLimit: '', feePeriodDays: '' })
    expect(existingFeeGrantFields({ ...capped, period: '3600s' })).toEqual({
      withFeegrant: true,
      feeSpendLimit: '2',
      feePeriodDays: '',
    })
  })

  it('never widens a limit it cannot show', () => {
    expect(existingFeeGrantFields({ ...capped, spendLimit: [{ denom: 'ibc/ABC', amount: '5' }] })).toEqual({
      withFeegrant: false,
      feeSpendLimit: '',
      feePeriodDays: '',
    })
  })

  it('turns the fee grant on for a grantee who has one and back off when the grantee changes', () => {
    const prefilled = retargetGrantOptions(EMPTY_GRANT_OPTIONS_INPUT, undefined, capped)
    expect(prefilled).toEqual(input({ withFeegrant: true, feeSpendLimit: '2', feePeriodDays: '7' }))
    expect(retargetGrantOptions(prefilled, capped, undefined)).toEqual(EMPTY_GRANT_OPTIONS_INPUT)
    expect(retargetGrantOptions(prefilled, capped, unlimited)).toEqual(input({ withFeegrant: true }))
  })

  it('keeps fee inputs the user already set', () => {
    const typed = input({ withFeegrant: true, feeSpendLimit: '9' })
    expect(retargetGrantOptions(typed, undefined, capped)).toBe(typed)
    const declined = input({ withFeegrant: false })
    const prefilled = retargetGrantOptions(declined, undefined, capped)
    const turnedOff = { ...prefilled, withFeegrant: false }
    expect(retargetGrantOptions(turnedOff, capped, capped)).toBe(turnedOff)
  })

  it('leaves a first-time grant untouched, so its message stays the default one', () => {
    expect(retargetGrantOptions(EMPTY_GRANT_OPTIONS_INPUT, undefined, undefined)).toEqual(EMPTY_GRANT_OPTIONS_INPUT)
    expect(readGrantOptions(retargetGrantOptions(EMPTY_GRANT_OPTIONS_INPUT, undefined, undefined), NOW)).toEqual({
      options: NO_GRANT_OPTIONS,
      issue: null,
    })
  })
})
