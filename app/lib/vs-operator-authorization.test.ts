import { describe, expect, it } from 'vitest'
import {
  EMPTY_VS_OPERATOR_INPUT,
  permittedVsOperatorMsgTypes,
  type VsOperatorInput,
  vsOperatorAuthorization,
  vsOperatorIssue,
} from './vs-operator-authorization'

const OPERATOR = 'verana1pjluhuuyzgdey0syket0xqthv2usmjfe4pta2s'
const SESSION = '/verana.pp.v1.MsgCreateOrUpdateParticipantSession'
const VALIDATE = '/verana.pp.v1.MsgSetParticipantOPToValidated'
const RESOLVE = '/verana.pp.v1.MsgTriggerResolver'
const input = (overrides: Partial<VsOperatorInput>) => ({ ...EMPTY_VS_OPERATOR_INPUT, ...overrides })

describe('permittedVsOperatorMsgTypes', () => {
  it.each([
    ['HOLDER', [RESOLVE]],
    ['ISSUER', [SESSION, VALIDATE]],
    ['VERIFIER', [SESSION]],
    ['ISSUER_GRANTOR', [VALIDATE]],
    ['VERIFIER_GRANTOR', [VALIDATE]],
    ['ECOSYSTEM', [VALIDATE]],
  ] as const)('follows the VPR table for %s', (role, expected) => {
    expect(permittedVsOperatorMsgTypes(role)).toEqual(expected)
  })
})

describe('vsOperatorIssue', () => {
  it('accepts no delegation and a bare VS operator account', () => {
    expect(vsOperatorIssue('ISSUER', EMPTY_VS_OPERATOR_INPUT)).toBeNull()
    expect(vsOperatorIssue('ISSUER', input({ vsOperator: OPERATOR }))).toBeNull()
  })

  it('refuses an account that is not a Verana address', () => {
    expect(vsOperatorIssue('ISSUER', input({ vsOperator: 'cosmos1abc' }))).toBe('invalidOperator')
  })

  it('needs the account and at least one message once any authorization field is set', () => {
    expect(vsOperatorIssue('ISSUER', input({ msgTypes: [SESSION] }))).toBe('operatorRequired')
    expect(vsOperatorIssue('ISSUER', input({ vsOperator: OPERATOR, spendLimit: '10' }))).toBe('msgTypesRequired')
  })

  it('refuses a message the role may not delegate', () => {
    expect(vsOperatorIssue('VERIFIER', input({ vsOperator: OPERATOR, msgTypes: [VALIDATE] }))).toBe(
      'msgTypeNotPermitted'
    )
  })

  it('ties the fee budget to the fee grant and the period to the spend limit', () => {
    const base = { vsOperator: OPERATOR, msgTypes: [SESSION] }
    expect(vsOperatorIssue('ISSUER', input({ ...base, withFeegrant: true }))).toBe('feeSpendLimitRequired')
    expect(vsOperatorIssue('ISSUER', input({ ...base, feeSpendLimit: '5' }))).toBe('feeSpendLimitWithoutFeegrant')
    expect(vsOperatorIssue('ISSUER', input({ ...base, periodDays: '30' }))).toBe('periodRequiresSpendLimit')
    expect(vsOperatorIssue('ISSUER', input({ ...base, withFeegrant: true, feeSpendLimit: '0' }))).toBe('invalidAmount')
    expect(vsOperatorIssue('ISSUER', input({ ...base, spendLimit: '1.5' }))).toBe('invalidAmount')
  })
})

describe('vsOperatorAuthorization', () => {
  it('maps no input to the manual mode fields', () => {
    expect(vsOperatorAuthorization('ECOSYSTEM')).toEqual({
      vsOperator: '',
      vsOperatorAuthzMsgTypes: [],
      vsOperatorAuthzSpendLimit: [],
      vsOperatorAuthzWithFeegrant: false,
      vsOperatorAuthzFeeSpendLimit: [],
      vsOperatorAuthzPeriod: undefined,
    })
  })

  it('maps a full delegation to native coins, a period in seconds and the table order', () => {
    expect(
      vsOperatorAuthorization(
        'ISSUER',
        input({
          vsOperator: ` ${OPERATOR} `,
          msgTypes: [VALIDATE, SESSION],
          spendLimit: '1000000',
          periodDays: '30',
          withFeegrant: true,
          feeSpendLimit: '50000',
        })
      )
    ).toEqual({
      vsOperator: OPERATOR,
      vsOperatorAuthzMsgTypes: [SESSION, VALIDATE],
      vsOperatorAuthzSpendLimit: [{ denom: 'uvna', amount: '1000000' }],
      vsOperatorAuthzWithFeegrant: true,
      vsOperatorAuthzFeeSpendLimit: [{ denom: 'uvna', amount: '50000' }],
      vsOperatorAuthzPeriod: { seconds: 2_592_000, nanos: 0 },
    })
  })

  it('fails fast on an invalid configuration', () => {
    expect(() => vsOperatorAuthorization('HOLDER', input({ msgTypes: [RESOLVE] }))).toThrow(
      'Invalid VS operator configuration for HOLDER: operatorRequired'
    )
  })
})
