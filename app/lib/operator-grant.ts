import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { veranaDenom } from '@/config/veranaChain.sign.client'
import { translate } from '@/i18n/dataview'
import type { CostLine } from '@/lib/tx-preview'
import { formatVNAFromUVNA } from '@/util/util'

export interface GrantLimit {
  amountUvna: string
  periodSeconds: number | null
}

export interface OperatorGrantOptions {
  expiration: Date | null
  spendLimit: GrantLimit | null
  feeGrant: { spendLimit: GrantLimit | null } | null
}

export const NO_GRANT_OPTIONS: OperatorGrantOptions = { expiration: null, spendLimit: null, feeGrant: null }

export interface GrantOptionsInput {
  expiration: string
  spendLimit: string
  spendPeriodDays: string
  withFeegrant: boolean
  feeSpendLimit: string
  feePeriodDays: string
}

export const EMPTY_GRANT_OPTIONS_INPUT: GrantOptionsInput = {
  expiration: '',
  spendLimit: '',
  spendPeriodDays: '',
  withFeegrant: false,
  feeSpendLimit: '',
  feePeriodDays: '',
}

export const GRANT_ISSUES = {
  expiration: 'corporation.grant.issue.expiration',
  amount: 'corporation.grant.issue.amount',
  period: 'corporation.grant.issue.period',
  periodNeedsExpiration: 'corporation.grant.issue.periodexpiration',
} as const

export type GrantIssue = (typeof GRANT_ISSUES)[keyof typeof GRANT_ISSUES]

export type GrantOptionsReading = { options: OperatorGrantOptions; issue: null } | { options: null; issue: GrantIssue }

const SECONDS_PER_DAY = 86_400
const MAX_GO_DURATION_DAYS = 106_751
const UVNA_DECIMALS = 6

export function vnaToUvna(text: string): string | null {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(text.trim())
  if (!match) return null
  const uvna = BigInt(match[1]) * BigInt(10 ** UVNA_DECIMALS) + BigInt((match[2] ?? '').padEnd(UVNA_DECIMALS, '0'))
  return uvna > BigInt(0) ? uvna.toString() : null
}

export function uvnaToVna(uvna: string): string {
  const padded = uvna.padStart(UVNA_DECIMALS + 1, '0')
  const whole = padded.slice(0, -UVNA_DECIMALS).replace(/^0+(?=\d)/, '')
  const fraction = padded.slice(-UVNA_DECIMALS).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}

export function updateGrantOptions(input: GrantOptionsInput, patch: Partial<GrantOptionsInput>): GrantOptionsInput {
  const next = { ...input, ...patch }
  if (next.spendLimit.trim() === '') next.spendPeriodDays = ''
  if (next.feeSpendLimit.trim() === '') next.feePeriodDays = ''
  return next
}

type ExistingCoins = { denom: string; amount: string }[] | null

export interface ExistingFeeGrant {
  grantee: string
  spendLimit: ExistingCoins
  period: string | null
}

export interface ExistingAuthorization {
  operator: string
  spendLimit: ExistingCoins
  period: string | null
  expiration: string | null
}

type FeeGrantFields = Pick<GrantOptionsInput, 'withFeegrant' | 'feeSpendLimit' | 'feePeriodDays'>
type AuthorizationFields = Pick<GrantOptionsInput, 'expiration' | 'spendLimit' | 'spendPeriodDays'>

const NO_FEE_GRANT_FIELDS: FeeGrantFields = { withFeegrant: false, feeSpendLimit: '', feePeriodDays: '' }
const NO_AUTHORIZATION_FIELDS: AuthorizationFields = { expiration: '', spendLimit: '', spendPeriodDays: '' }

export function feeGrantFor<T extends { grantee: string }>(grants: readonly T[], grantee: string): T | undefined {
  return grantee ? grants.find((grant) => grant.grantee === grantee) : undefined
}

export function authorizationFor<T extends { operator: string }>(
  authorizations: readonly T[],
  operator: string
): T | undefined {
  return operator ? authorizations.find((authorization) => authorization.operator === operator) : undefined
}

function indexerPeriodSeconds(value: string | null): number | null {
  const match = value ? /^(\d+)s$/.exec(value) : null
  return match ? Number(match[1]) : null
}

function limitInputs(spendLimit: ExistingCoins, period: string | null): { amount: string; days: string } | null {
  const [coin, ...others] = spendLimit ?? []
  if (!coin || others.length > 0 || coin.denom !== veranaDenom) return null
  const seconds = indexerPeriodSeconds(period)
  return {
    amount: uvnaToVna(coin.amount),
    days: seconds !== null && seconds % SECONDS_PER_DAY === 0 ? String(seconds / SECONDS_PER_DAY) : '',
  }
}

function dateTimeInput(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function existingFeeGrantFields(grant: ExistingFeeGrant): FeeGrantFields {
  if (!grant.spendLimit) return { ...NO_FEE_GRANT_FIELDS, withFeegrant: true }
  const limit = limitInputs(grant.spendLimit, grant.period)
  return limit ? { withFeegrant: true, feeSpendLimit: limit.amount, feePeriodDays: limit.days } : NO_FEE_GRANT_FIELDS
}

export function existingAuthorizationFields(authorization: ExistingAuthorization): AuthorizationFields {
  const limit = limitInputs(authorization.spendLimit, authorization.period)
  return {
    expiration: authorization.expiration ? dateTimeInput(authorization.expiration) : '',
    spendLimit: limit?.amount ?? '',
    spendPeriodDays: limit?.days ?? '',
  }
}

function retargetFields<K extends keyof GrantOptionsInput>(
  input: GrantOptionsInput,
  previous: Pick<GrantOptionsInput, K>,
  next: Pick<GrantOptionsInput, K>
): GrantOptionsInput {
  const untouched = (Object.keys(previous) as K[]).every((key) => input[key] === previous[key])
  return untouched ? { ...input, ...next } : input
}

export function retargetGrantOptions(
  input: GrantOptionsInput,
  previous: ExistingFeeGrant | undefined,
  next: ExistingFeeGrant | undefined
): GrantOptionsInput {
  return retargetFields(
    input,
    previous ? existingFeeGrantFields(previous) : NO_FEE_GRANT_FIELDS,
    next ? existingFeeGrantFields(next) : NO_FEE_GRANT_FIELDS
  )
}

export function retargetAuthorizationOptions(
  input: GrantOptionsInput,
  previous: ExistingAuthorization | undefined,
  next: ExistingAuthorization | undefined
): GrantOptionsInput {
  return retargetFields(
    input,
    previous ? existingAuthorizationFields(previous) : NO_AUTHORIZATION_FIELDS,
    next ? existingAuthorizationFields(next) : NO_AUTHORIZATION_FIELDS
  )
}

function validPeriod(seconds: number): boolean {
  return Number.isSafeInteger(seconds) && seconds > 0 && seconds <= MAX_GO_DURATION_DAYS * SECONDS_PER_DAY
}

export function operatorGrantIssue(options: OperatorGrantOptions, now: number = Date.now()): GrantIssue | null {
  if (options.expiration && !(options.expiration.getTime() > now)) return GRANT_ISSUES.expiration
  const limits = [options.spendLimit, options.feeGrant?.spendLimit ?? null]
  for (const limit of limits) {
    if (!limit) continue
    if (!/^[1-9]\d*$/.test(limit.amountUvna)) return GRANT_ISSUES.amount
    if (limit.periodSeconds === null) continue
    if (!validPeriod(limit.periodSeconds)) return GRANT_ISSUES.period
    if (!options.expiration) return GRANT_ISSUES.periodNeedsExpiration
  }
  return null
}

type Read<T> = { value: T } | { issue: GrantIssue }

function readLimit(amountText: string, periodText: string): Read<GrantLimit | null> {
  if (amountText.trim() === '') return { value: null }
  const amountUvna = vnaToUvna(amountText)
  if (amountUvna === null) return { issue: GRANT_ISSUES.amount }
  const days = periodText.trim()
  if (days === '') return { value: { amountUvna, periodSeconds: null } }
  if (!/^\d+$/.test(days)) return { issue: GRANT_ISSUES.period }
  return { value: { amountUvna, periodSeconds: Number(days) * SECONDS_PER_DAY } }
}

function readExpiration(text: string): Read<Date | null> {
  if (text.trim() === '') return { value: null }
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? { issue: GRANT_ISSUES.expiration } : { value: date }
}

export function readGrantOptions(input: GrantOptionsInput, now: number = Date.now()): GrantOptionsReading {
  const expiration = readExpiration(input.expiration)
  if ('issue' in expiration) return { options: null, issue: expiration.issue }
  const spendLimit = readLimit(input.spendLimit, input.spendPeriodDays)
  if ('issue' in spendLimit) return { options: null, issue: spendLimit.issue }
  const feeSpendLimit = readLimit(input.feeSpendLimit, input.feePeriodDays)
  if (input.withFeegrant && 'issue' in feeSpendLimit) return { options: null, issue: feeSpendLimit.issue }
  const options: OperatorGrantOptions = {
    expiration: expiration.value,
    spendLimit: spendLimit.value,
    feeGrant: input.withFeegrant && 'value' in feeSpendLimit ? { spendLimit: feeSpendLimit.value } : null,
  }
  const issue = operatorGrantIssue(options, now)
  return issue ? { options: null, issue } : { options, issue: null }
}

function limitCoins(limit: GrantLimit | null) {
  return limit ? [{ denom: veranaDenom, amount: limit.amountUvna }] : []
}

function limitPeriod(limit: GrantLimit | null) {
  return limit?.periodSeconds ? { seconds: limit.periodSeconds, nanos: 0 } : undefined
}

export interface OperatorGrantParties {
  corporation: string
  operator: string
  grantee: string
  msgTypes: string[]
}

export function grantOperatorAuthorization(
  parties: OperatorGrantParties,
  options: OperatorGrantOptions
): MsgGrantOperatorAuthorization {
  const feeLimit = options.feeGrant?.spendLimit ?? null
  return MsgGrantOperatorAuthorization.fromPartial({
    ...parties,
    expiration: options.expiration ?? undefined,
    authzSpendLimit: limitCoins(options.spendLimit),
    authzSpendLimitPeriod: limitPeriod(options.spendLimit),
    withFeegrant: options.feeGrant !== null,
    feegrantSpendLimit: limitCoins(feeLimit),
    feegrantSpendLimitPeriod: limitPeriod(feeLimit),
  })
}

export function formatPeriod(seconds: number): string {
  if (seconds % SECONDS_PER_DAY === 0) return `${seconds / SECONDS_PER_DAY}d`
  if (seconds % 3_600 === 0) return `${seconds / 3_600}h`
  if (seconds % 60 === 0) return `${seconds / 60}m`
  return `${seconds}s`
}

export function formatIndexerPeriod(value: string): string {
  const seconds = indexerPeriodSeconds(value)
  return seconds === null ? value : formatPeriod(seconds)
}

export function formatGrantLimit(limit: GrantLimit): string {
  const amount = formatVNAFromUVNA(limit.amountUvna)
  if (limit.periodSeconds === null) return amount
  return translate('corporation.grant.limit.every', { amount, period: formatPeriod(limit.periodSeconds) })
}

export function grantOptionLines(options: OperatorGrantOptions, replacesFeeGrant: boolean): CostLine[] {
  const lines: CostLine[] = []
  if (options.spendLimit) {
    lines.push({ label: translate('delegation.spendLimit'), value: formatGrantLimit(options.spendLimit) })
  }
  if (options.expiration) {
    lines.push({ label: translate('delegation.expiration'), value: options.expiration.toLocaleString() })
  }
  const feeGrant = options.feeGrant
  lines.push({
    label: translate('corporation.grant.feegrant.line'),
    value: !feeGrant
      ? translate(replacesFeeGrant ? 'corporation.grant.feegrant.revoked' : 'common.none')
      : feeGrant.spendLimit
        ? formatGrantLimit(feeGrant.spendLimit)
        : translate('delegation.unlimited'),
  })
  return lines
}
