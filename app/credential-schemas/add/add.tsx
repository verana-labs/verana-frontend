'use client'

import { BracesIcon, CircleAlertIcon, FileJson2Icon, TriangleAlertIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useActionSigning } from '@/hooks/useSigningMode'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { NATIVE_PRICING } from '@/lib/pricing-asset'
import { resolveMsgCopy } from '@/msg/constants/resolveMsgTypeConfig'
import { useProtocolParams } from '@/providers/protocol-params-context'
import { CorporationRequired } from '@/ui/common/corporation-required'
import { ToneTag } from '@/ui/common/tone-tag'
import { WizardLayout } from '@/ui/common/wizard/wizard-layout'
import { boundedCredentialSchemaSections, type CredentialSchemaData } from '@/ui/dataview/datasections/cs'
import {
  isResolvedDataField,
  type ResolvedDataField,
  resolveTranslatable,
  translateSections,
  visibleFieldsForMode,
} from '@/ui/dataview/types'
import { SuccessCheck } from '@/ui/motion/feedback'
import { Field, FieldDescription, FieldError } from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'
import { getErrorMessage, isValidField } from '@/util/validations'

const DEFAULT_VALIDITY_DAYS = 365
const MESSAGE_TYPE = 'MsgCreateCredentialSchema'

const STEPS = ['schema', 'roles', 'validity', 'review'] as const
type SchemaStep = (typeof STEPS)[number]

const STEP_FIELDS = {
  schema: ['jsonSchema'],
  roles: ['issuerOnboardingMode', 'verifierOnboardingMode', 'holderOnboardingMode', 'digestAlgorithm'],
  validity: [
    'issuerGrantorValidationValidityPeriod',
    'verifierGrantorValidationValidityPeriod',
    'issuerValidationValidityPeriod',
    'verifierValidationValidityPeriod',
    'holderValidationValidityPeriod',
  ],
} as const satisfies Record<Exclude<SchemaStep, 'review'>, readonly string[]>

type FormStep = keyof typeof STEP_FIELDS
type SchemaField = ResolvedDataField<CredentialSchemaData>
type SchemaAttribute = { name: string; type: string; required: boolean }
type SchemaPreview = { title: string; description: string; attributes: SchemaAttribute[] }
type SummaryEntry = { label: string; value: string }

function defaultDays(max: number | null): number {
  return max === null ? DEFAULT_VALIDITY_DAYS : Math.min(DEFAULT_VALIDITY_DAYS, max)
}

function inStep(target: FormStep, name: string): boolean {
  return (STEP_FIELDS[target] as readonly string[]).includes(name)
}

function stepOfField(name: string): FormStep {
  if (inStep('schema', name)) return 'schema'
  if (inStep('validity', name)) return 'validity'
  return 'roles'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function attributeType(definition: unknown): string {
  if (!isRecord(definition)) return '—'
  const { type, format } = definition
  const base = Array.isArray(type) ? type.join(' | ') : typeof type === 'string' ? type : '—'
  return typeof format === 'string' ? `${base} (${format})` : base
}

function parseSchemaPreview(json: string): SchemaPreview | null {
  let doc: unknown
  try {
    doc = JSON.parse(json)
  } catch {
    return null
  }
  if (!isRecord(doc)) return null
  const required = Array.isArray(doc.required) ? doc.required.filter((name) => typeof name === 'string') : []
  const properties = isRecord(doc.properties) ? doc.properties : {}
  return {
    title: typeof doc.title === 'string' ? doc.title : '',
    description: typeof doc.description === 'string' ? doc.description : '',
    attributes: Object.entries(properties).map(([name, definition]) => ({
      name,
      type: attributeType(definition),
      required: required.includes(name),
    })),
  }
}

function optionLabel(field: SchemaField, value: unknown): string {
  return field.options?.find((option) => String(option.value) === String(value))?.label ?? String(value ?? '—')
}

function SchemaFieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: SchemaField
  value: unknown
  error: string | null
  onChange: (value: unknown) => void
}) {
  const formId = useId()
  const key = String(field.name)
  const controlId = `${formId}-${key}`
  const errorId = `${controlId}-error`
  const descriptionId = `${controlId}-description`
  const describedBy = [error ? errorId : null, field.description ? descriptionId : null].filter(Boolean).join(' ')
  const controlProps = {
    id: controlId,
    disabled: field.disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    'aria-required': field.required || undefined,
  }

  let control: ReactNode
  if (field.inputType === 'textarea') {
    control = (
      <Textarea
        {...controlProps}
        className="field-sizing-fixed min-h-56 font-mono text-xs md:text-xs"
        spellCheck={false}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        rows={12}
      />
    )
  } else if (field.inputType === 'select') {
    control = (
      <select
        {...controlProps}
        className="select"
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          {resolveTranslatable({ key: 'messages.select' }, translate) ?? 'Select…'}
        </option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else {
    control = (
      <Input
        {...controlProps}
        type="text"
        inputMode={inStep('validity', key) ? 'numeric' : undefined}
        className="h-9 tabular-nums"
        value={String(value ?? '')}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <Field data-invalid={error ? true : undefined} data-disabled={field.disabled || undefined}>
      <Label htmlFor={controlId} className="data-edit-label block">
        {field.label}
        {field.required ? (
          <span className="data-edit-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {control}
      {error ? (
        <FieldError id={errorId} className="data-edit-error">
          {error}
        </FieldError>
      ) : null}
      {field.description ? (
        <FieldDescription id={descriptionId} className="data-edit-input-description">
          {field.description}
        </FieldDescription>
      ) : null}
    </Field>
  )
}

function AttributesTable({ preview }: { preview: SchemaPreview }) {
  if (preview.attributes.length === 0) {
    return <p className="px-3 py-3 text-sm text-muted-foreground">{translate('wizard.schema.noattributes')}</p>
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th scope="col" className="px-3 py-2 text-start font-medium">
            {translate('wizard.schema.attribute')}
          </th>
          <th scope="col" className="px-3 py-2 text-start font-medium">
            {translate('wizard.schema.type')}
          </th>
          <th scope="col" className="px-3 py-2 text-end font-medium">
            <span className="sr-only">{translate('wizard.schema.required')}</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/70 border-t border-border/70">
        {preview.attributes.map((attribute) => (
          <tr key={attribute.name}>
            <td className="px-3 py-2 font-mono text-xs break-all text-foreground">{attribute.name}</td>
            <td className="px-3 py-2 text-xs text-muted-foreground">{attribute.type}</td>
            <td className="px-3 py-2 text-end">
              {attribute.required ? (
                <ToneTag tone="accent" dot>
                  {translate('wizard.schema.required')}
                </ToneTag>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SchemaSummary({
  preview,
  ecosystemLabel,
  roles,
  validity,
}: {
  preview: SchemaPreview | null
  ecosystemLabel: string
  roles: SummaryEntry[]
  validity: SummaryEntry[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/60 text-primary-foreground shadow-sm"
        >
          <FileJson2Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {preview?.title || translate('ecosystem.credentialSchema.add.title')}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">{ecosystemLabel}</p>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2 border-t border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">{translate('wizard.schema.attributes')}</span>
        <span className="text-xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
          {preview ? preview.attributes.length : '—'}
        </span>
      </div>
      <dl className="flex flex-col gap-2 border-t border-border/70 pt-3">
        {roles.map((role) => (
          <div key={role.label} className="flex flex-col items-start gap-1">
            <dt className="text-xs text-muted-foreground">{role.label}</dt>
            <dd>
              <ToneTag tone="accent">{role.value}</ToneTag>
            </dd>
          </div>
        ))}
      </dl>
      <dl className="flex flex-col gap-1.5 border-t border-border/70 pt-3">
        {validity.map((entry) => (
          <div key={entry.label} className="flex items-baseline justify-between gap-2 text-xs">
            <dt className="min-w-0 truncate text-muted-foreground">{entry.label}</dt>
            <dd className="shrink-0 font-medium text-foreground tabular-nums">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function AddCredentialSchemaWizard({ ecosystemId }: { ecosystemId: number }) {
  const router = useRouter()
  const params = useProtocolParams()
  const { actingCorporation, loading: corporationLoading, error: corporationError } = useUserCorporation()
  const { ecosystem } = useEcosystemData(String(ecosystemId))
  const signing = useActionSigning(MESSAGE_TYPE)
  const proposal = signing.mode === 'proposal'
  const mounted = useRef(true)
  const ecosystemHref = `/ecosystems/${ecosystemId}`
  const schemasHref = `${ecosystemHref}?tab=schemas`
  const uiMsgType = resolveMsgCopy(MESSAGE_TYPE)
  const requiredLabel = resolveTranslatable({ key: 'messages.required' }, translate) ?? 'Required'

  const fields = useMemo(() => {
    const sections = translateSections(boundedCredentialSchemaSections(params))
    const basic = sections.find((section) => (!section.type || section.type === 'basic') && !section.noEdit)
    return visibleFieldsForMode(basic?.fields, 'create').filter(isResolvedDataField)
  }, [params])

  const [draft, setDraft] = useState<CredentialSchemaData>(() => ({
    id: '',
    ecosystemId,
    issuerGrantorValidationValidityPeriod: defaultDays(params.issuerGrantorValidityMaxDays),
    verifierGrantorValidationValidityPeriod: defaultDays(params.verifierGrantorValidityMaxDays),
    issuerValidationValidityPeriod: defaultDays(params.issuerValidityMaxDays),
    verifierValidationValidityPeriod: defaultDays(params.verifierValidityMaxDays),
    holderValidationValidityPeriod: defaultDays(params.holderValidityMaxDays),
    issuerOnboardingMode: 1,
    verifierOnboardingMode: 1,
    holderOnboardingMode: 2,
    pricingAssetType: NATIVE_PRICING.pricingAssetType,
    pricingAsset: NATIVE_PRICING.pricingAsset,
    digestAlgorithm: 'sha384',
    archived: null,
    jsonSchema: '',
    title: resolveTranslatable({ key: 'ecosystem.credentialSchema.add.title' }, translate),
  }))
  const [step, setStep] = useState<SchemaStep>('schema')
  const [tried, setTried] = useState<ReadonlySet<SchemaStep>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const { submitTx } = useSubmitTxMsgTypeFromObject(
    () => setSubmitted(true),
    () => {
      if (mounted.current) router.push(schemasHref)
    }
  )

  const preview = useMemo(() => parseSchemaPreview(draft.jsonSchema), [draft.jsonSchema])
  const fieldValue = (field: SchemaField): unknown => draft[field.name]

  function fieldError(field: SchemaField): string | null {
    const current = fieldValue(field)
    const empty = current === undefined || current === null || (typeof current === 'string' && current.trim() === '')
    if (field.required && empty) return requiredLabel
    return isValidField(field, current) ? null : getErrorMessage(field)
  }

  const stepFields = (target: FormStep) => fields.filter((field) => stepOfField(String(field.name)) === target)
  const firstInvalid = (target: FormStep) => stepFields(target).find((field) => fieldError(field) !== null)
  const missingFor = (field: SchemaField | undefined) =>
    field ? translate('wizard.schema.missing', { field: field.label }) : undefined
  const markTried = (target: SchemaStep) => setTried((previous) => new Set(previous).add(target))

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    try {
      await submitTx(MESSAGE_TYPE, draft)
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)
  const steps = STEPS.map((entry) => ({
    id: entry,
    title: translate(`wizard.schema.step.${entry}`),
    description: translate(`wizard.schema.step.${entry}.desc`),
    status: submitted ? ('complete' as const) : undefined,
  }))

  const blockedStep = (['schema', 'roles', 'validity'] as const).find((target) => firstInvalid(target))
  const ecosystemIssue = !ecosystem
    ? undefined
    : ecosystem.archived
      ? translate('wizard.schema.archived')
      : actingCorporation && actingCorporation.corporation.id !== ecosystem.corporationId
        ? translate('wizard.schema.notowner')
        : undefined
  const reviewBlocker = ecosystemIssue ?? (signing.disabled ? signing.reason : undefined)
  const next = submitted
    ? { label: translate('wizard.schema.view'), onClick: () => router.push(schemasHref) }
    : step === 'review'
      ? {
          missing: blockedStep ? missingFor(firstInvalid(blockedStep)) : reviewBlocker,
          onMissing: () => {
            if (!blockedStep) return
            markTried(blockedStep)
            setStep(blockedStep)
          },
          pending: submitting || corporationLoading,
          label: uiMsgType.label,
          className: 'btn-action-confirm',
          onClick: () => void submit(),
        }
      : {
          missing: missingFor(firstInvalid(step)),
          onMissing: () => markTried(step),
          onClick: () => setStep(STEPS[stepIndex + 1]),
        }

  const summaryFor = (target: FormStep, format: (field: SchemaField) => string): SummaryEntry[] =>
    stepFields(target).map((field) => ({ label: field.label, value: format(field) }))
  const roleSummary = summaryFor('roles', (field) => optionLabel(field, fieldValue(field)))
  const validitySummary = summaryFor('validity', (field) => {
    const days = String(fieldValue(field) ?? '').trim()
    return days !== '' && Number(days) === 0
      ? translate('wizard.schema.never')
      : translate('wizard.schema.days', { n: days })
  })
  const ecosystemLabel = ecosystem?.did ?? `#${ecosystemId}`

  if (!actingCorporation && !corporationLoading) {
    return (
      <CorporationRequired
        title={translate('datatable.cs.add')}
        description={translate('wizard.schema.desc')}
        failed={Boolean(corporationError)}
      />
    )
  }

  return (
    <WizardLayout
      title={translate('datatable.cs.add')}
      description={translate('wizard.schema.desc')}
      back={{ href: ecosystemHref, label: ecosystemLabel }}
      steps={steps}
      current={submitted ? 'review' : step}
      onStepClick={submitting || submitted ? undefined : (id) => setStep(id as SchemaStep)}
      summaryTitle={translate('wizard.schema.preview')}
      summary={
        <SchemaSummary
          preview={preview}
          ecosystemLabel={ecosystemLabel}
          roles={roleSummary}
          validity={validitySummary}
        />
      }
      onBack={
        submitting || submitted
          ? undefined
          : stepIndex > 0
            ? () => setStep(STEPS[stepIndex - 1])
            : () => router.push(ecosystemHref)
      }
      backLabel={stepIndex === 0 ? translate('messages.cancel') : undefined}
      next={next}
    >
      {reviewBlocker && !submitted ? (
        <div
          role="note"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-tint-destructive px-4 py-3 text-sm text-destructive"
        >
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{reviewBlocker}</p>
        </div>
      ) : null}
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <SuccessCheck className="size-14" />
          <p className="text-base font-semibold text-foreground">
            {translate(proposal ? 'wizard.schema.proposed' : 'wizard.schema.submitted')}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {translate(proposal ? 'wizard.schema.proposed.desc' : 'wizard.schema.submitted.desc')}
          </p>
        </div>
      ) : step === 'review' ? (
        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-lg ring-1 ring-border/70">
            <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-2.5">
              <BracesIcon aria-hidden="true" className="size-4 text-primary" />
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {preview?.title || translate('dataview.cs.fields.jsonSchema')}
              </p>
            </div>
            {preview ? <AttributesTable preview={preview} /> : null}
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg bg-muted/40 p-4 ring-1 ring-border/60 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">
                {translate('dataview.ecosystem.fields.did')}
              </dt>
              <dd className="mt-0.5 truncate font-mono text-sm text-foreground">{ecosystemLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                {translate('dataview.cs.fields.pricingAsset')}
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-foreground">{draft.pricingAsset}</dd>
            </div>
          </dl>
          {uiMsgType.warning ? (
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-tint-warning px-4 py-3 text-sm"
            >
              <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <p className="font-medium text-warning">
                  {resolveTranslatable({ key: 'messages.warning' }, translate)}
                </p>
                <p className="text-foreground">{uiMsgType.warning}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={step === 'schema' ? 'flex flex-col gap-5' : 'grid gap-5 @2xl/wizard:grid-cols-2'}>
          {stepFields(step).map((field) => (
            <SchemaFieldControl
              key={String(field.name)}
              field={field}
              value={fieldValue(field)}
              error={tried.has(step) ? fieldError(field) : null}
              onChange={(next) => setDraft((previous) => ({ ...previous, [field.name]: next }))}
            />
          ))}
          {step === 'schema' && preview ? (
            <section
              aria-label={translate('wizard.schema.preview')}
              className="overflow-hidden rounded-lg ring-1 ring-border/70"
            >
              <div className="border-b border-border/70 bg-muted/40 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">
                  {preview.title || translate('wizard.schema.preview')}
                </p>
                {preview.description ? <p className="text-xs text-muted-foreground">{preview.description}</p> : null}
              </div>
              <AttributesTable preview={preview} />
            </section>
          ) : null}
        </div>
      )}
    </WizardLayout>
  )
}
