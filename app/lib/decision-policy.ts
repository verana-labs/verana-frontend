import { PercentageDecisionPolicy, ThresholdDecisionPolicy } from 'cosmjs-types/cosmos/group/v1/types'
import type { Any } from 'cosmjs-types/google/protobuf/any'
import { indexerPeriodSeconds } from '@/lib/operator-grant'

export type DecisionPolicyKind = 'threshold' | 'percentage'

export type DecisionRule = { kind: 'threshold'; threshold: string } | { kind: 'percentage'; percentage: string }

export interface DecisionPolicyInput {
  rule: DecisionRule
  votingPeriodSeconds: number
  minExecutionPeriodSeconds: number
}

export interface CurrentDecisionPolicy {
  threshold: string | null
  percentage: string | null
  votingPeriod: string | null
  minExecutionPeriod: string | null
}

export interface DecisionPolicyDraft {
  kind: DecisionPolicyKind
  threshold: string
  percent: string
  votingPeriod: string
  minExecutionPeriod: string
}

export const DEFAULT_DECISION_POLICY_DRAFT: DecisionPolicyDraft = {
  kind: 'threshold',
  threshold: '1',
  percent: '50',
  votingPeriod: '60',
  minExecutionPeriod: '0',
}

// Mirrors verana-node app/app_config.go group MaxExecutionPeriod, which no query exposes.
const MAX_EXECUTION_PERIOD_SECONDS = 1_209_600

const POSITIVE_INTEGER = /^[1-9]\d*$/

function wholeSeconds(value: string): number | null {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null
}

export function encodeDecisionPolicy({
  rule,
  votingPeriodSeconds,
  minExecutionPeriodSeconds,
}: DecisionPolicyInput): Any {
  const windows = {
    votingPeriod: { seconds: BigInt(votingPeriodSeconds), nanos: 0 },
    minExecutionPeriod: { seconds: BigInt(minExecutionPeriodSeconds), nanos: 0 },
  }
  if (rule.kind === 'percentage') {
    return {
      typeUrl: '/cosmos.group.v1.PercentageDecisionPolicy',
      value: PercentageDecisionPolicy.encode(
        PercentageDecisionPolicy.fromPartial({ percentage: rule.percentage, windows })
      ).finish(),
    }
  }
  return {
    typeUrl: '/cosmos.group.v1.ThresholdDecisionPolicy',
    value: ThresholdDecisionPolicy.encode(
      ThresholdDecisionPolicy.fromPartial({ threshold: rule.threshold, windows })
    ).finish(),
  }
}

export function percentToDecimal(percent: string): string | null {
  const match = /^(\d+)(?:\.(\d{1,16}))?$/.exec(percent)
  if (!match) return null
  const fraction = match[2] ?? ''
  const digits = `${match[1]}${fraction}`.padStart(fraction.length + 3, '0')
  const cut = digits.length - fraction.length - 2
  const whole = digits.slice(0, cut).replace(/^0+(?=\d)/, '')
  const decimals = digits.slice(cut).replace(/0+$/, '')
  const valid = whole === '0' ? decimals !== '' : whole === '1' && decimals === ''
  if (!valid) return null
  return decimals ? `${whole}.${decimals}` : whole
}

export function decimalToPercent(decimal: string): string | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(decimal)
  if (!match) return null
  const fraction = (match[2] ?? '').padEnd(2, '0')
  const whole = `${match[1]}${fraction.slice(0, 2)}`.replace(/^0+(?=\d)/, '')
  const decimals = fraction.slice(2).replace(/0+$/, '')
  return decimals ? `${whole}.${decimals}` : whole
}

export function formatDecisionRule(rule: DecisionRule): string {
  return rule.kind === 'threshold' ? rule.threshold : `${decimalToPercent(rule.percentage) ?? rule.percentage}%`
}

export function currentDecisionRule(
  policy: Pick<CurrentDecisionPolicy, 'threshold' | 'percentage'>
): DecisionRule | null {
  if (policy.percentage !== null) return { kind: 'percentage', percentage: policy.percentage }
  if (policy.threshold !== null) return { kind: 'threshold', threshold: policy.threshold }
  return null
}

function draftSeconds(period: string | null, fallback: string): string {
  const seconds = indexerPeriodSeconds(period)
  return seconds === null ? fallback : String(Math.ceil(seconds))
}

export function currentDecisionPolicyDraft(policy: CurrentDecisionPolicy): DecisionPolicyDraft {
  return {
    kind: policy.percentage === null ? 'threshold' : 'percentage',
    threshold: policy.threshold ?? DEFAULT_DECISION_POLICY_DRAFT.threshold,
    percent:
      (policy.percentage === null ? null : decimalToPercent(policy.percentage)) ??
      DEFAULT_DECISION_POLICY_DRAFT.percent,
    votingPeriod: draftSeconds(policy.votingPeriod, DEFAULT_DECISION_POLICY_DRAFT.votingPeriod),
    minExecutionPeriod: draftSeconds(policy.minExecutionPeriod, DEFAULT_DECISION_POLICY_DRAFT.minExecutionPeriod),
  }
}

export function exceedsExecutionWindow(
  draft: Pick<DecisionPolicyDraft, 'votingPeriod' | 'minExecutionPeriod'>
): boolean {
  const votingPeriodSeconds = wholeSeconds(draft.votingPeriod)
  const minExecutionPeriodSeconds = wholeSeconds(draft.minExecutionPeriod)
  return (
    votingPeriodSeconds !== null &&
    minExecutionPeriodSeconds !== null &&
    minExecutionPeriodSeconds > votingPeriodSeconds + MAX_EXECUTION_PERIOD_SECONDS
  )
}

export function readDecisionPolicyDraft(draft: DecisionPolicyDraft): DecisionPolicyInput | null {
  const votingPeriodSeconds = wholeSeconds(draft.votingPeriod)
  const minExecutionPeriodSeconds = wholeSeconds(draft.minExecutionPeriod)
  if (!votingPeriodSeconds || minExecutionPeriodSeconds === null || exceedsExecutionWindow(draft)) return null
  const windows = { votingPeriodSeconds, minExecutionPeriodSeconds }
  if (draft.kind === 'threshold') {
    return POSITIVE_INTEGER.test(draft.threshold)
      ? { rule: { kind: 'threshold', threshold: draft.threshold }, ...windows }
      : null
  }
  const percentage = percentToDecimal(draft.percent)
  return percentage ? { rule: { kind: 'percentage', percentage }, ...windows } : null
}
