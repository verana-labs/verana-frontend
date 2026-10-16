import { PercentageDecisionPolicy, ThresholdDecisionPolicy } from 'cosmjs-types/cosmos/group/v1/types'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DECISION_POLICY_DRAFT,
  decimalToPercent,
  encodeDecisionPolicy,
  exceedsExecutionWindow,
  formatDecisionRule,
  percentToDecimal,
  readDecisionPolicyDraft,
} from './decision-policy'

describe('encodeDecisionPolicy', () => {
  it('encodes a threshold policy with both windows', () => {
    const encoded = encodeDecisionPolicy({
      rule: { kind: 'threshold', threshold: '3' },
      votingPeriodSeconds: 300,
      minExecutionPeriodSeconds: 3_600,
    })
    expect(encoded.typeUrl).toBe('/cosmos.group.v1.ThresholdDecisionPolicy')
    expect(ThresholdDecisionPolicy.decode(encoded.value)).toEqual({
      threshold: '3',
      windows: {
        votingPeriod: { seconds: BigInt(300), nanos: 0 },
        minExecutionPeriod: { seconds: BigInt(3_600), nanos: 0 },
      },
    })
  })

  it('encodes a percentage policy with its decimal string', () => {
    const encoded = encodeDecisionPolicy({
      rule: { kind: 'percentage', percentage: '0.6667' },
      votingPeriodSeconds: 86_400,
      minExecutionPeriodSeconds: 0,
    })
    expect(encoded.typeUrl).toBe('/cosmos.group.v1.PercentageDecisionPolicy')
    expect(PercentageDecisionPolicy.decode(encoded.value)).toEqual({
      percentage: '0.6667',
      windows: {
        votingPeriod: { seconds: BigInt(86_400), nanos: 0 },
        minExecutionPeriod: { seconds: BigInt(0), nanos: 0 },
      },
    })
  })
})

describe('percentToDecimal', () => {
  it.each([
    ['50', '0.5'],
    ['100', '1'],
    ['0100', '1'],
    ['1', '0.01'],
    ['33.33', '0.3333'],
    ['66.6666666666666667', '0.666666666666666667'],
    ['0.5', '0.005'],
    ['7.10', '0.071'],
    ['050', '0.5'],
  ])('converts %s%% to %s', (percent, decimal) => {
    expect(percentToDecimal(percent)).toBe(decimal)
  })

  it.each([
    '0',
    '0.0',
    '100.5',
    '101',
    '1000',
    '-5',
    '',
    ' 50',
    '50%',
    '1e1',
    '.5',
    '5.',
    '1.00000000000000001',
  ])('rejects %j', (percent) => {
    expect(percentToDecimal(percent)).toBeNull()
  })
})

describe('decimalToPercent', () => {
  it.each([
    ['0.5', '50'],
    ['1', '100'],
    ['0.500000000000000000', '50'],
    ['1.000000000000000000', '100'],
    ['0.3333', '33.33'],
    ['0.005', '0.5'],
    ['0.01', '1'],
  ])('shows %s as %s%%', (decimal, percent) => {
    expect(decimalToPercent(decimal)).toBe(percent)
  })

  it('returns null for a value that is not a decimal', () => {
    expect(decimalToPercent('half')).toBeNull()
  })

  it('round-trips with percentToDecimal', () => {
    for (const percent of ['50', '100', '33.33', '0.5', '12.345']) {
      expect(decimalToPercent(percentToDecimal(percent) ?? '')).toBe(percent)
    }
  })
})

describe('formatDecisionRule', () => {
  it('shows a threshold as its weight and a percentage as a percent', () => {
    expect(formatDecisionRule({ kind: 'threshold', threshold: '3' })).toBe('3')
    expect(formatDecisionRule({ kind: 'percentage', percentage: '0.5' })).toBe('50%')
  })
})

describe('readDecisionPolicyDraft', () => {
  it('reads the default draft as today’s threshold policy', () => {
    expect(readDecisionPolicyDraft(DEFAULT_DECISION_POLICY_DRAFT)).toEqual({
      rule: { kind: 'threshold', threshold: '1' },
      votingPeriodSeconds: 60,
      minExecutionPeriodSeconds: 0,
    })
  })

  it('reads a percentage draft with a minimum execution period', () => {
    expect(
      readDecisionPolicyDraft({
        ...DEFAULT_DECISION_POLICY_DRAFT,
        kind: 'percentage',
        percent: '66.67',
        minExecutionPeriod: '3600',
      })
    ).toEqual({
      rule: { kind: 'percentage', percentage: '0.6667' },
      votingPeriodSeconds: 60,
      minExecutionPeriodSeconds: 3_600,
    })
  })

  it('validates only the field of the chosen kind', () => {
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, threshold: '0' })).toBeNull()
    expect(
      readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, kind: 'percentage', threshold: '0' })
    ).not.toBeNull()
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, kind: 'percentage', percent: '0' })).toBeNull()
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, percent: '0' })).not.toBeNull()
  })

  it('needs a positive voting period and a non-negative whole minimum execution period', () => {
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, votingPeriod: '0' })).toBeNull()
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, minExecutionPeriod: '' })).toBeNull()
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, minExecutionPeriod: '1.5' })).toBeNull()
  })

  it('rejects durations beyond the safe integer range instead of encoding them', () => {
    const twentyDigits = '12345678901234567890'
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, votingPeriod: twentyDigits })).toBeNull()
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, votingPeriod: '9'.repeat(400) })).toBeNull()
    expect(readDecisionPolicyDraft({ ...DEFAULT_DECISION_POLICY_DRAFT, minExecutionPeriod: twentyDigits })).toBeNull()
  })

  it('keeps the minimum execution period below the voting period plus the 14 day execution window', () => {
    const atLimit = { ...DEFAULT_DECISION_POLICY_DRAFT, votingPeriod: '60', minExecutionPeriod: '1209660' }
    const belowLimit = { ...atLimit, minExecutionPeriod: '1209659' }
    expect(exceedsExecutionWindow(atLimit)).toBe(true)
    expect(readDecisionPolicyDraft(atLimit)).toBeNull()
    expect(exceedsExecutionWindow(belowLimit)).toBe(false)
    expect(readDecisionPolicyDraft(belowLimit)?.minExecutionPeriodSeconds).toBe(1_209_659)
  })
})
