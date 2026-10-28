'use client'

import { useId } from 'react'
import { translate } from '@/i18n/dataview'
import { type DecisionPolicyDraft, type DecisionPolicyKind, exceedsExecutionWindow } from '@/lib/decision-policy'
import { AddressIssueNote } from '@/ui/common/address-issue'
import { ThresholdHint } from '@/ui/common/threshold-hint'
import { FIELD_INPUT, FIELD_LABEL, FIELD_SELECT } from '@/ui/corporation/form-styles'

const KINDS: readonly DecisionPolicyKind[] = ['threshold', 'percentage']

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
      <div className={FIELD_LABEL}>
        <label htmlFor={kindId}>{translate('corporation.policy.kind')}</label>
        <select
          id={kindId}
          value={value.kind}
          onChange={(event) => set({ kind: event.target.value as DecisionPolicyKind })}
          className={FIELD_SELECT}
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
          <label className={FIELD_LABEL}>
            {translate('corporation.page.threshold')}
            <input
              inputMode="numeric"
              value={value.threshold}
              onChange={(event) => set({ threshold: event.target.value })}
              className={FIELD_INPUT}
            />
          </label>
          <ThresholdHint threshold={Number(value.threshold)} totalWeight={totalWeight} />
        </div>
      ) : (
        <label className={FIELD_LABEL}>
          {translate('corporation.policy.percent')}
          <input
            value={value.percent}
            inputMode="decimal"
            onChange={(event) => set({ percent: event.target.value })}
            className={FIELD_INPUT}
          />
        </label>
      )}
      <label className={FIELD_LABEL}>
        {translate('corporation.wizard.votingperiod')}
        <input
          inputMode="numeric"
          value={value.votingPeriod}
          onChange={(event) => set({ votingPeriod: event.target.value })}
          className={FIELD_INPUT}
        />
      </label>
      <div>
        <label className={FIELD_LABEL}>
          {translate('corporation.policy.minexecutionperiod')}
          <input
            inputMode="numeric"
            value={value.minExecutionPeriod}
            onChange={(event) => set({ minExecutionPeriod: event.target.value })}
            className={FIELD_INPUT}
          />
        </label>
        <AddressIssueNote issue={exceedsExecutionWindow(value) ? 'corporation.policy.minexecutionperiod.max' : null} />
      </div>
    </>
  )
}
