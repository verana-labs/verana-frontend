'use client'

import { veranaDenom } from '@/config/veranaChain.sign.client'
import { translate } from '@/i18n/dataview'
import { msgShortName } from '@/lib/tx-preview'
import {
  permittedVsOperatorMsgTypes,
  type VsOperatorInput,
  type VsOperatorIssue,
} from '@/lib/vs-operator-authorization'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'

type VsOperatorFieldsProps = {
  role: ParticipantRole
  value: VsOperatorInput
  onChange: (next: VsOperatorInput) => void
  issue: VsOperatorIssue | null
}

type TextField = 'vsOperator' | 'spendLimit' | 'periodDays' | 'feeSpendLimit'

const INPUT_CLASS =
  'w-full px-4 py-3 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface text-gray-900 dark:text-white'
const CHECKBOX_CLASS = 'w-4 h-4 text-primary-600 border-neutral-20 dark:border-neutral-70 rounded'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function VsOperatorFields({ role, value, onChange, issue }: VsOperatorFieldsProps) {
  const field = (name: TextField, label: string) => (
    <div key={name}>
      <label
        htmlFor={`vs-operator-${name}`}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
      </label>
      <input
        id={`vs-operator-${name}`}
        type="text"
        inputMode={name === 'vsOperator' ? undefined : 'numeric'}
        value={value[name]}
        onChange={(event) => onChange({ ...value, [name]: event.target.value })}
        className={INPUT_CLASS}
      />
    </div>
  )
  const toggleMsgType = (type: string, checked: boolean) =>
    onChange({
      ...value,
      msgTypes: checked ? [...value.msgTypes, type] : value.msgTypes.filter((entry) => entry !== type),
    })

  return (
    <details className="rounded-lg border border-neutral-20 dark:border-neutral-70 p-4">
      <summary className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
        {t('join.vsoperator.title')}
      </summary>
      <div className="mt-4 space-y-4">
        <p
          role="note"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          {t('join.vsoperator.frozen')}
        </p>
        <p className="text-xs text-neutral-70 dark:text-neutral-70">{t('join.vsoperator.hint')}</p>
        {field('vsOperator', t('join.vsoperator.account'))}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('join.vsoperator.msgtypes')}
          </legend>
          <div className="space-y-2">
            {permittedVsOperatorMsgTypes(role).map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={value.msgTypes.includes(type)}
                  onChange={(event) => toggleMsgType(type, event.target.checked)}
                  className={CHECKBOX_CLASS}
                />
                <span className="font-mono">{msgShortName(type)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('spendLimit', `${t('join.vsoperator.spendlimit')} (${veranaDenom})`)}
          {field('periodDays', t('join.vsoperator.period'))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={value.withFeegrant}
            onChange={(event) => onChange({ ...value, withFeegrant: event.target.checked })}
            className={CHECKBOX_CLASS}
          />
          {t('join.vsoperator.feegrant')}
        </label>
        {field('feeSpendLimit', `${t('join.vsoperator.feespendlimit')} (${veranaDenom})`)}
        {issue ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {t(`join.vsoperator.issue.${issue}`)}
          </p>
        ) : null}
      </div>
    </details>
  )
}
