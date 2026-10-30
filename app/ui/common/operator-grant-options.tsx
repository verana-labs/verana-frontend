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
  grantMessageTypes,
  retargetAuthorizationOptions,
  retargetGrantOptions,
  retargetMessageTypes,
  unlistedMsgTypes,
  updateGrantOptions,
} from '@/lib/operator-grant'
import { FIELD_CHECKBOX, FIELD_HINT, FIELD_INPUT, FIELD_LABEL } from '@/ui/corporation/form-styles'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className={FIELD_LABEL}>
        {label}
        {children}
      </label>
      {hint ? <p className={FIELD_HINT}>{hint}</p> : null}
    </div>
  )
}

export function useOperatorGrantDraft(
  feeGrants: readonly ExistingFeeGrant[],
  authorizations: readonly ExistingAuthorization[]
) {
  const [grantee, setGranteeText] = useState('')
  const [options, setOptions] = useState(EMPTY_GRANT_OPTIONS_INPUT)
  const [msgTypes, setMsgTypes] = useState(() => grantMessageTypes(undefined))
  const target = grantee.trim()
  const existingFeeGrant = feeGrantFor(feeGrants, target)
  const existingAuthorization = authorizationFor(authorizations, target)
  const keptMsgTypes = unlistedMsgTypes(existingAuthorization)

  function setGrantee(next: string): { feeGrant: boolean; authorization: boolean } {
    const nextFeeGrant = feeGrantFor(feeGrants, next.trim())
    const nextAuthorization = authorizationFor(authorizations, next.trim())
    setOptions((current) =>
      retargetAuthorizationOptions(
        retargetGrantOptions(current, existingFeeGrant, nextFeeGrant),
        existingAuthorization,
        nextAuthorization
      )
    )
    setMsgTypes((current) => retargetMessageTypes(current, existingAuthorization, nextAuthorization))
    setGranteeText(next)
    return { feeGrant: nextFeeGrant !== undefined, authorization: nextAuthorization !== undefined }
  }

  function reset() {
    setGranteeText('')
    setOptions(EMPTY_GRANT_OPTIONS_INPUT)
    setMsgTypes(grantMessageTypes(undefined))
  }

  return {
    grantee,
    target,
    setGrantee,
    options,
    setOptions,
    msgTypes,
    setMsgTypes,
    keptMsgTypes,
    existingFeeGrant,
    reset,
  }
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
    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Field label={translate('corporation.grant.expiration')} hint={translate('corporation.grant.expiration.hint')}>
          <input
            type="datetime-local"
            value={value.expiration}
            onChange={(event) => set({ expiration: event.target.value })}
            className={FIELD_INPUT}
          />
        </Field>
      </div>
      <Field label={translate('corporation.grant.spendlimit')} hint={translate('corporation.grant.spendlimit.hint')}>
        <input
          inputMode="decimal"
          value={value.spendLimit}
          onChange={(event) => set({ spendLimit: event.target.value })}
          className={FIELD_INPUT}
        />
      </Field>
      <Field label={translate('corporation.grant.period')}>
        <input
          inputMode="numeric"
          value={value.spendPeriodDays}
          onChange={(event) => set({ spendPeriodDays: event.target.value })}
          disabled={value.spendLimit.trim() === ''}
          className={FIELD_INPUT}
        />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm text-foreground transition-colors duration-(--duration-base) has-checked:border-primary/40 has-checked:bg-primary/5 md:col-span-2 dark:bg-input/30">
        <input
          type="checkbox"
          checked={value.withFeegrant}
          onChange={(event) => set({ withFeegrant: event.target.checked })}
          className={`mt-0.5 ${FIELD_CHECKBOX}`}
        />
        {translate('corporation.grant.feegrant')}
      </label>
      {replacesFeeGrant && !value.withFeegrant ? (
        <p className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning md:col-span-2">
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
              className={FIELD_INPUT}
            />
          </Field>
          <Field label={translate('corporation.grant.feeperiod')}>
            <input
              inputMode="numeric"
              value={value.feePeriodDays}
              onChange={(event) => set({ feePeriodDays: event.target.value })}
              disabled={value.feeSpendLimit.trim() === ''}
              className={FIELD_INPUT}
            />
          </Field>
        </>
      ) : null}
    </div>
  )
}
