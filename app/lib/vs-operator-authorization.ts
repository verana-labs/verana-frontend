import { veranaTypeUrls } from '@verana-labs/verana-types/signing'
import { veranaDenom } from '@/config/veranaChain.sign.client'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { isValidVeranaAddress } from '@/util/validations'

export type VsOperatorInput = {
  vsOperator: string
  msgTypes: string[]
  spendLimit: string
  periodDays: string
  withFeegrant: boolean
  feeSpendLimit: string
}

export const EMPTY_VS_OPERATOR_INPUT: VsOperatorInput = {
  vsOperator: '',
  msgTypes: [],
  spendLimit: '',
  periodDays: '',
  withFeegrant: false,
  feeSpendLimit: '',
}

export type VsOperatorIssue =
  | 'invalidOperator'
  | 'operatorRequired'
  | 'msgTypesRequired'
  | 'msgTypeNotPermitted'
  | 'invalidAmount'
  | 'feeSpendLimitRequired'
  | 'feeSpendLimitWithoutFeegrant'
  | 'periodRequiresSpendLimit'

export type VsOperatorAuthorizationFields = {
  vsOperator: string
  vsOperatorAuthzMsgTypes: string[]
  vsOperatorAuthzSpendLimit: { denom: string; amount: string }[]
  vsOperatorAuthzWithFeegrant: boolean
  vsOperatorAuthzFeeSpendLimit: { denom: string; amount: string }[]
  vsOperatorAuthzPeriod: { seconds: number; nanos: number } | undefined
}

const PERMITTED_MSG_TYPES: Partial<Record<ParticipantRole, string[]>> = {
  ISSUER_GRANTOR: [veranaTypeUrls.MsgSetParticipantOPToValidated],
  VERIFIER_GRANTOR: [veranaTypeUrls.MsgSetParticipantOPToValidated],
  ISSUER: [veranaTypeUrls.MsgCreateOrUpdateParticipantSession, veranaTypeUrls.MsgSetParticipantOPToValidated],
  VERIFIER: [veranaTypeUrls.MsgCreateOrUpdateParticipantSession],
  HOLDER: [veranaTypeUrls.MsgTriggerResolver],
}

const POSITIVE_WHOLE = /^[1-9]\d*$/
const SECONDS_PER_DAY = 86_400

export function permittedVsOperatorMsgTypes(role: ParticipantRole): string[] {
  return PERMITTED_MSG_TYPES[role] ?? []
}

function safePositiveWhole(value: string, factor = 1): boolean {
  return POSITIVE_WHOLE.test(value) && Number.isSafeInteger(Number(value) * factor)
}

export function vsOperatorIssue(role: ParticipantRole, input: VsOperatorInput): VsOperatorIssue | null {
  const operator = input.vsOperator.trim()
  const spendLimit = input.spendLimit.trim()
  const period = input.periodDays.trim()
  const feeSpendLimit = input.feeSpendLimit.trim()
  const delegates =
    input.msgTypes.length > 0 || spendLimit !== '' || period !== '' || input.withFeegrant || feeSpendLimit !== ''
  if (operator && !isValidVeranaAddress(operator)) return 'invalidOperator'
  if (!delegates) return null
  if (!operator) return 'operatorRequired'
  if (input.msgTypes.length === 0) return 'msgTypesRequired'
  if (input.msgTypes.some((type) => !permittedVsOperatorMsgTypes(role).includes(type))) return 'msgTypeNotPermitted'
  if ([spendLimit, feeSpendLimit].some((value) => value !== '' && !safePositiveWhole(value))) return 'invalidAmount'
  if (period !== '' && !safePositiveWhole(period, SECONDS_PER_DAY)) return 'invalidAmount'
  if (input.withFeegrant && feeSpendLimit === '') return 'feeSpendLimitRequired'
  if (!input.withFeegrant && feeSpendLimit !== '') return 'feeSpendLimitWithoutFeegrant'
  if (period !== '' && spendLimit === '') return 'periodRequiresSpendLimit'
  return null
}

function nativeCoins(amount: string): { denom: string; amount: string }[] {
  return amount ? [{ denom: veranaDenom, amount }] : []
}

export function vsOperatorAuthorization(
  role: ParticipantRole,
  input: VsOperatorInput = EMPTY_VS_OPERATOR_INPUT
): VsOperatorAuthorizationFields {
  const issue = vsOperatorIssue(role, input)
  if (issue) throw new Error(`Invalid VS operator configuration for ${role}: ${issue}`)
  const period = input.periodDays.trim()
  return {
    vsOperator: input.vsOperator.trim(),
    vsOperatorAuthzMsgTypes: permittedVsOperatorMsgTypes(role).filter((type) => input.msgTypes.includes(type)),
    vsOperatorAuthzSpendLimit: nativeCoins(input.spendLimit.trim()),
    vsOperatorAuthzWithFeegrant: input.withFeegrant,
    vsOperatorAuthzFeeSpendLimit: nativeCoins(input.feeSpendLimit.trim()),
    vsOperatorAuthzPeriod: period ? { seconds: Number(period) * SECONDS_PER_DAY, nanos: 0 } : undefined,
  }
}
