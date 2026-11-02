'use client'

import { useId } from 'react'
import { translate } from '@/i18n/dataview'
import { type DecisionPolicyDraft, type DecisionPolicyKind, exceedsExecutionWindow } from '@/lib/decision-policy'
import { AddressIssueNote } from '@/ui/common/address-issue'
import { ThresholdHint } from '@/ui/common/threshold-hint'

const KINDS: readonly DecisionPolicyKind[] = ['threshold', 'percentage']

const LABEL = 'text-sm font-medium text-gray-700 dark:text-gray-300'
const INPUT =
  'mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface'

export function DecisionPolicyFields({
  value,
  onChange,
  totalWeight,
}: {
  value: DecisionPolicyDraft
  onChange: (next: DecisionPolicyDraft) => void
  totalWeight: number
}) {
  const kindId = useId()
  const set = (patch: Partial<DecisionPolicyDraft>) => onChange({ ...value, ...patch })
  return (
    <>
      <div>
        <label htmlFor={kindId} className={LABEL}>
          {translate('corporation.policy.kind')}
        </label>
        <select
          id={kindId}
          value={value.kind}
          onChange={(event) => set({ kind: event.target.value as DecisionPolicyKind })}
          className={INPUT}
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {translate(`corporation.page.${kind}`)}
            </option>
          ))}
        </select>
      </div>
      {value.kind === 'threshold' ? (
        <div>
          <label className={LABEL}>
            {translate('corporation.page.threshold')}
            <input
              value={value.threshold}
              onChange={(event) => set({ threshold: event.target.value })}
              className={INPUT}
            />
          </label>
          <ThresholdHint threshold={Number(value.threshold)} totalWeight={totalWeight} />
        </div>
      ) : (
        <label className={LABEL}>
          {translate('corporation.policy.percent')}
          <input
            value={value.percent}
            inputMode="decimal"
            onChange={(event) => set({ percent: event.target.value })}
            className={INPUT}
          />
        </label>
      )}
      <label className={LABEL}>
        {translate('corporation.wizard.votingperiod')}
        <input
          value={value.votingPeriod}
          onChange={(event) => set({ votingPeriod: event.target.value })}
          className={INPUT}
        />
      </label>
      <div>
        <label className={LABEL}>
          {translate('corporation.policy.minexecutionperiod')}
          <input
            value={value.minExecutionPeriod}
            onChange={(event) => set({ minExecutionPeriod: event.target.value })}
            className={INPUT}
          />
        </label>
        <AddressIssueNote issue={exceedsExecutionWindow(value) ? 'corporation.policy.minexecutionperiod.max' : null} />
      </div>
    </>
  )
}
