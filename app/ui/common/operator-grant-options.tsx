'use client'

import { type ReactNode, useState } from 'react'
import { translate } from '@/i18n/dataview'
import {
  authorizationFor,
  EMPTY_GRANT_OPTIONS_INPUT,
  type ExistingAuthorization,
  type ExistingFeeGrant,
  feeGrantFor,
  type GrantOptionsInput,
  retargetAuthorizationOptions,
  retargetGrantOptions,
  updateGrantOptions,
} from '@/lib/operator-grant'

const INPUT =
  'mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface disabled:opacity-50'
const LABEL = 'text-sm font-medium text-gray-700 dark:text-gray-300 block'
const HINT = 'mt-1 text-xs text-gray-500 dark:text-gray-400'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {children}
      </label>
      {hint ? <p className={HINT}>{hint}</p> : null}
    </div>
  )
}

export function useOperatorGrantDraft(
  feeGrants: readonly ExistingFeeGrant[],
  authorizations: readonly ExistingAuthorization[]
) {
  const [grantee, setGranteeText] = useState('')
  const [options, setOptions] = useState(EMPTY_GRANT_OPTIONS_INPUT)
  const target = grantee.trim()
  const existingFeeGrant = feeGrantFor(feeGrants, target)
  const existingAuthorization = authorizationFor(authorizations, target)

  function setGrantee(next: string): boolean {
    const nextFeeGrant = feeGrantFor(feeGrants, next.trim())
    const nextAuthorization = authorizationFor(authorizations, next.trim())
    setOptions((current) =>
      retargetAuthorizationOptions(
        retargetGrantOptions(current, existingFeeGrant, nextFeeGrant),
        existingAuthorization,
        nextAuthorization
      )
    )
    setGranteeText(next)
    return nextFeeGrant !== undefined || nextAuthorization !== undefined
  }

  function reset() {
    setGranteeText('')
    setOptions(EMPTY_GRANT_OPTIONS_INPUT)
  }

  return { grantee, target, setGrantee, options, setOptions, existingFeeGrant, reset }
}

export function OperatorGrantOptionsFields({
  value,
  onChange,
  replacesFeeGrant,
}: {
  value: GrantOptionsInput
  onChange: (next: GrantOptionsInput) => void
  replacesFeeGrant: boolean
}) {
  const set = (patch: Partial<GrantOptionsInput>) => onChange(updateGrantOptions(value, patch))
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
      <div className="md:col-span-2">
        <Field label={translate('corporation.grant.expiration')} hint={translate('corporation.grant.expiration.hint')}>
          <input
            type="datetime-local"
            value={value.expiration}
            onChange={(event) => set({ expiration: event.target.value })}
            className={INPUT}
          />
        </Field>
      </div>
      <Field label={translate('corporation.grant.spendlimit')} hint={translate('corporation.grant.spendlimit.hint')}>
        <input
          inputMode="decimal"
          value={value.spendLimit}
          onChange={(event) => set({ spendLimit: event.target.value })}
          className={INPUT}
        />
      </Field>
      <Field label={translate('corporation.grant.period')}>
        <input
          inputMode="numeric"
          value={value.spendPeriodDays}
          onChange={(event) => set({ spendPeriodDays: event.target.value })}
          disabled={value.spendLimit.trim() === ''}
          className={INPUT}
        />
      </Field>
      <label className="md:col-span-2 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={value.withFeegrant}
          onChange={(event) => set({ withFeegrant: event.target.checked })}
          className="mt-0.5"
        />
        {translate('corporation.grant.feegrant')}
      </label>
      {replacesFeeGrant && !value.withFeegrant ? (
        <p className="md:col-span-2 text-xs text-amber-700 dark:text-amber-300">
          {translate('corporation.grant.feegrant.revokewarning')}
        </p>
      ) : null}
      {value.withFeegrant ? (
        <>
          <Field label={translate('corporation.grant.feespendlimit')}>
            <input
              inputMode="decimal"
              value={value.feeSpendLimit}
              onChange={(event) => set({ feeSpendLimit: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label={translate('corporation.grant.feeperiod')}>
            <input
              inputMode="numeric"
              value={value.feePeriodDays}
              onChange={(event) => set({ feePeriodDays: event.target.value })}
              disabled={value.feeSpendLimit.trim() === ''}
              className={INPUT}
            />
          </Field>
        </>
      ) : null}
    </div>
  )
}
