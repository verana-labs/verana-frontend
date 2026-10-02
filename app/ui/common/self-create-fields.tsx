'use client'

import { veranaDenom } from '@/config/veranaChain.sign.client'
import { translate } from '@/i18n/dataview'
import type { SelfCreateInput, SelfCreateIssue } from '@/lib/participant-onboarding'
import { resolveTranslatable } from '@/ui/dataview/types'

type SelfCreateFieldsProps = {
  value: SelfCreateInput
  onChange: (next: SelfCreateInput) => void
  withFees: boolean
  issue: SelfCreateIssue | null
}

const INPUT_CLASS =
  'w-full px-4 py-3 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface text-gray-900 dark:text-white'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function SelfCreateFields({ value, onChange, withFees, issue }: SelfCreateFieldsProps) {
  const field = (name: keyof SelfCreateInput, label: string, type: 'datetime-local' | 'text') => (
    <div key={name}>
      <label
        htmlFor={`self-create-${name}`}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
      </label>
      <input
        id={`self-create-${name}`}
        type={type}
        inputMode={type === 'text' ? 'numeric' : undefined}
        value={value[name]}
        onChange={(event) => onChange({ ...value, [name]: event.target.value })}
        className={INPUT_CLASS}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('effectiveFrom', t('dataview.participant.fields.effectiveFrom'), 'datetime-local')}
        {field('effectiveUntil', t('dataview.participant.fields.effectiveUntil'), 'datetime-local')}
        {withFees
          ? field('validationFees', `${t('dataview.participant.fields.validationFees')} (${veranaDenom})`, 'text')
          : null}
        {withFees
          ? field('verificationFees', `${t('dataview.participant.fields.verificationFees')} (${veranaDenom})`, 'text')
          : null}
      </div>
      <p className="text-xs text-neutral-70 dark:text-neutral-70">{t('join.selfcreate.hint')}</p>
      {issue ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {t(`join.selfcreate.issue.${issue}`)}
        </p>
      ) : null}
    </div>
  )
}
