'use client'

import { ChevronDownIcon, TriangleAlertIcon, UserCogIcon } from 'lucide-react'
import { veranaDenom } from '@/config/veranaChain.sign.client'
import { translate } from '@/i18n/dataview'
import { msgShortName } from '@/lib/tx-preview'
import {
  permittedVsOperatorMsgTypes,
  type VsOperatorInput,
  type VsOperatorIssue,
} from '@/lib/vs-operator-authorization'
import { FIELD_CHECKBOX } from '@/ui/corporation/form-styles'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'

type VsOperatorFieldsProps = {
  role: ParticipantRole
  value: VsOperatorInput
  onChange: (next: VsOperatorInput) => void
  issue: VsOperatorIssue | null
}

type TextField = 'vsOperator' | 'spendLimit' | 'periodDays' | 'feeSpendLimit'

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function VsOperatorFields({ role, value, onChange, issue }: VsOperatorFieldsProps) {
  const field = (name: TextField, label: string) => (
    <div key={name}>
      <label htmlFor={`vs-operator-${name}`} className="data-edit-label">
        {label}
      </label>
      <input
        id={`vs-operator-${name}`}
        type="text"
        inputMode={name === 'vsOperator' ? undefined : 'numeric'}
        value={value[name]}
        onChange={(event) => onChange({ ...value, [name]: event.target.value })}
        className="input"
      />
    </div>
  )
  const toggleMsgType = (type: string, checked: boolean) =>
    onChange({
      ...value,
      msgTypes: checked ? [...value.msgTypes, type] : value.msgTypes.filter((entry) => entry !== type),
    })

  return (
    <div className="space-y-2">
      <details className="group/vs rounded-xl bg-card ring-1 ring-border open:ring-primary/25">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-3 text-sm font-medium text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCogIcon aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1">{t('join.vsoperator.title')}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-standard group-open/vs:rotate-180"
          />
        </summary>
        <div className="space-y-4 border-t border-border p-4 animate-in fade-in-0">
          <p
            role="note"
            className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t('join.vsoperator.frozen')}
          </p>
          <p className="text-xs text-muted-foreground">{t('join.vsoperator.hint')}</p>
          {field('vsOperator', t('join.vsoperator.account'))}
          <fieldset>
            <legend className="data-edit-label">{t('join.vsoperator.msgtypes')}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {permittedVsOperatorMsgTypes(role).map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm text-foreground has-checked:border-primary/40 has-checked:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    checked={value.msgTypes.includes(type)}
                    onChange={(event) => toggleMsgType(type, event.target.checked)}
                    className={FIELD_CHECKBOX}
                  />
                  <span className="min-w-0 truncate font-mono text-xs">{msgShortName(type)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('spendLimit', `${t('join.vsoperator.spendlimit')} (${veranaDenom})`)}
            {field('periodDays', t('join.vsoperator.period'))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={value.withFeegrant}
              onChange={(event) => onChange({ ...value, withFeegrant: event.target.checked })}
              className={FIELD_CHECKBOX}
            />
            {t('join.vsoperator.feegrant')}
          </label>
          {field('feeSpendLimit', `${t('join.vsoperator.feespendlimit')} (${veranaDenom})`)}
        </div>
      </details>
      {issue ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`join.vsoperator.issue.${issue}`)}
        </p>
      ) : null}
    </div>
  )
}
