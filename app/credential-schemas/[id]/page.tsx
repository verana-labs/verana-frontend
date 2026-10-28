'use client'

import { faBoxArchive, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import {
  BracesIcon,
  InfinityIcon,
  type LucideIcon,
  NetworkIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA } from '@/config/env'
import { useActivityHistory } from '@/hooks/useActivityHistory'
import { useCanonicalJsonSchema } from '@/hooks/useCanonicalJsonSchema'
import { useCredentialSchemaData } from '@/hooks/useCredentialSchemaData'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useActionSigning } from '@/hooks/useSigningMode'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { isNativePricing } from '@/lib/pricing-asset'
import { cn } from '@/lib/utils'
import { useProtocolParams } from '@/providers/protocol-params-context'
import { ActivityHistorySection } from '@/ui/common/activity-history-section'
import { CapabilityButton, EntityActionButton } from '@/ui/common/capability-button'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import JsonCodeBlock from '@/ui/common/json-code-block'
import { ModalAction } from '@/ui/common/modal-action'
import { PricingNotice } from '@/ui/common/pricing-notice'
import { type CredentialSchemaData, VALIDITY_MAX_DAYS } from '@/ui/dataview/datasections/cs'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Shimmer } from '@/ui/motion/shimmer'
import { SchemaHero, SchemaHeroSkeleton, type SchemaStatus } from '@/ui/participants/schema-hero'
import { Button, buttonVariants } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Spinner } from '@/ui/shadcn/spinner'

type ValidityField = keyof Pick<
  CredentialSchemaData,
  | 'issuerGrantorValidationValidityPeriod'
  | 'verifierGrantorValidationValidityPeriod'
  | 'issuerValidationValidityPeriod'
  | 'verifierValidationValidityPeriod'
  | 'holderValidationValidityPeriod'
>

const VALIDITY_FIELDS: Array<{ labelKey: string; field: ValidityField }> = [
  {
    labelKey: 'dataview.cs.fields.issuerGrantorValidationValidityPeriod',
    field: 'issuerGrantorValidationValidityPeriod',
  },
  {
    labelKey: 'dataview.cs.fields.verifierGrantorValidationValidityPeriod',
    field: 'verifierGrantorValidationValidityPeriod',
  },
  { labelKey: 'dataview.cs.fields.issuerValidationValidityPeriod', field: 'issuerValidationValidityPeriod' },
  { labelKey: 'dataview.cs.fields.verifierValidationValidityPeriod', field: 'verifierValidationValidityPeriod' },
  { labelKey: 'dataview.cs.fields.holderValidationValidityPeriod', field: 'holderValidationValidityPeriod' },
]

type ValidityValues = Record<ValidityField, number>

const JSON_BLOCK_CLASS = 'max-h-[32rem] overflow-y-auto'

function validityValues(schema: CredentialSchemaData): ValidityValues {
  return {
    issuerGrantorValidationValidityPeriod: schema.issuerGrantorValidationValidityPeriod,
    verifierGrantorValidationValidityPeriod: schema.verifierGrantorValidationValidityPeriod,
    issuerValidationValidityPeriod: schema.issuerValidationValidityPeriod,
    verifierValidationValidityPeriod: schema.verifierValidationValidityPeriod,
    holderValidationValidityPeriod: schema.holderValidationValidityPeriod,
  }
}

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <CardTitle>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
        {children}
      </h2>
    </CardTitle>
  )
}

function ValidityFieldView({ labelKey, value }: { labelKey: string; value: number }) {
  const label = resolveTranslatable({ key: labelKey }, translate) ?? labelKey
  const never = value === 0
  const valueText = never
    ? (resolveTranslatable({ key: 'dataview.cs.value.never' }, translate) ?? 'Never expires')
    : (resolveTranslatable({ key: 'dataview.cs.value.days', values: { n: value } }, translate) ?? `${value} days`)
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="min-w-0 text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums',
          never ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {never ? <InfinityIcon aria-hidden="true" className="size-4" /> : null}
        {valueText}
      </dd>
    </div>
  )
}

function ValidityFieldInput({
  labelKey,
  value,
  max,
  onChange,
  disabled,
}: {
  labelKey: string
  value: number
  max: number | null
  onChange: (value: number) => void
  disabled: boolean
}) {
  const label = resolveTranslatable({ key: labelKey }, translate) ?? labelKey
  const days = resolveTranslatable({ key: 'dataview.cs.value.daysShort' }, translate) ?? 'days'
  const bound = max === null ? '' : `, ${translate('dataview.cs.value.maxDays', { n: max })}`
  const invalid = max !== null && value > max
  const inputId = useId()
  const errorId = useId()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-xs leading-snug text-muted-foreground">
        {`${label} (${days}${bound})`}
      </Label>
      <Input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={0}
        max={max ?? undefined}
        step={1}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isFinite(parsed)) onChange(Math.max(0, Math.floor(parsed)))
        }}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className="tabular-nums"
      />
      {invalid ? (
        <p id={errorId} className="data-edit-error">
          {translate('dataview.cs.value.overMax', { n: max })}
        </p>
      ) : null}
    </div>
  )
}

function WarningLine({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground">
      <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>{children}</p>
    </div>
  )
}

function SchemaPageSkeleton() {
  return (
    <div aria-busy="true">
      <SchemaHeroSkeleton />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Card>
          <CardContent className="space-y-4">
            <Shimmer className="h-5 w-48" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((cell) => (
                <Shimmer key={cell} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <Shimmer className="h-5 w-24" />
            <Shimmer className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CredentialSchemaViewPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const { credentialSchema, errorCredentialSchema, refetch: refetchCredentialSchema } = useCredentialSchemaData(id)
  const canonicalJsonSchema = useCanonicalJsonSchema(id)
  const history = useActivityHistory(
    VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA && id ? `${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/history/${id}` : undefined
  )
  const ecosystemId = credentialSchema ? String(credentialSchema.ecosystemId) : ''
  const { ecosystem } = useEcosystemData(ecosystemId)
  const { actingCorporation } = useUserCorporation()
  const update = useActionSigning('MsgUpdateCredentialSchema')
  const protocolParams = useProtocolParams()

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [editValues, setEditValues] = useState<ValidityValues | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [archiveActive, setArchiveActive] = useState(false)

  const refresh = () => {
    void refetchCredentialSchema()
    void history.refetch()
  }
  const { submitTx } = useSubmitTxMsgTypeFromObject(() => setMode('view'), refresh)

  const owner =
    credentialSchema !== null && ecosystem !== null && actingCorporation?.corporation.id === ecosystem.corporationId
  const editable = owner && update.reason === undefined

  useEffect(() => {
    if (!editable && mode === 'edit') {
      setMode('view')
      setEditValues(null)
    }
  }, [editable, mode])

  if (!credentialSchema) {
    if (errorCredentialSchema) {
      return (
        <div className="error-pane">
          {errorCredentialSchema ||
            (resolveTranslatable({ key: 'error.cs.notfound' }, translate) ?? 'Credential Schema not found')}
        </div>
      )
    }
    return <SchemaPageSkeleton />
  }

  const isArchived = Boolean(credentialSchema.archived)
  const status: SchemaStatus = isArchived ? 'ARCHIVED' : 'ACTIVE'
  const archiveMessageType = isArchived ? 'MsgUnarchiveCredentialSchema' : 'MsgArchiveCredentialSchema'
  const archiveTitleKey = isArchived
    ? 'dataview.cs.actions.unarchiveCredentialSchema'
    : 'dataview.cs.actions.archiveCredentialSchema'
  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback
  const currentCredentialSchema = credentialSchema

  function startEdit() {
    setEditValues(validityValues(currentCredentialSchema))
    setMode('edit')
  }

  function cancelEdit() {
    setMode('view')
    setEditValues(null)
  }

  async function confirmEdit() {
    if (!editValues) return
    setSubmitting(true)
    try {
      await submitTx('MsgUpdateCredentialSchema', { id: currentCredentialSchema.id, ...editValues })
    } finally {
      setSubmitting(false)
    }
  }

  const outOfBounds =
    editValues !== null &&
    VALIDITY_FIELDS.some(({ field }) => {
      const max = protocolParams[VALIDITY_MAX_DAYS[field]]
      return max !== null && editValues[field] > max
    })

  function patchEditValue(field: ValidityField, value: number) {
    setEditValues((previous) => (previous ? { ...previous, [field]: value } : previous))
  }

  return (
    <>
      <SchemaHero
        title={credentialSchema.title ?? `Schema ${credentialSchema.id}`}
        description={credentialSchema.description}
        id={credentialSchema.id}
        status={status}
        issuerOnboardingMode={credentialSchema.issuerOnboardingMode}
        verifierOnboardingMode={credentialSchema.verifierOnboardingMode}
        holderOnboardingMode={credentialSchema.holderOnboardingMode ?? undefined}
        ecosystem={ecosystem ? { id: String(ecosystem.id), did: ecosystem.did } : null}
        ecosystemPending={!ecosystem}
        action={
          <Button size="lg" onClick={() => router.push(`/participants/${credentialSchema.id}`)} className="px-4">
            <NetworkIcon aria-hidden="true" />
            <span>{t('participants.title', 'Participants')}</span>
          </Button>
        }
      />

      {isNativePricing(credentialSchema) ? null : <PricingNotice schema={credentialSchema} className="mb-6" />}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <BlurFade delay={0.05}>
            <Card>
              <CardHeader className="border-b">
                <SectionTitle icon={SlidersHorizontalIcon}>
                  {t('dataview.section.mutable', 'Mutable Configuration')}
                </SectionTitle>
                {owner && mode === 'view' ? (
                  <CardAction className="flex flex-wrap justify-end gap-2">
                    <CapabilityButton
                      signing={update}
                      icon={faPenToSquare}
                      label={t('dataview.cs.button.editConfiguration', 'Edit Configuration')}
                      onClick={startEdit}
                      className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}
                    />
                    <EntityActionButton
                      msgType={archiveMessageType}
                      icon={faBoxArchive}
                      label={
                        isArchived
                          ? t('dataview.cs.button.unarchive', 'Unarchive')
                          : t('dataview.cs.button.archive', 'Archive')
                      }
                      onClick={() => setArchiveActive(true)}
                      className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
                    />
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent>
                {mode === 'view' || !editValues ? (
                  <dl className="divide-y">
                    {VALIDITY_FIELDS.map(({ labelKey, field }) => (
                      <ValidityFieldView key={field} labelKey={labelKey} value={credentialSchema[field]} />
                    ))}
                  </dl>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {VALIDITY_FIELDS.map(({ labelKey, field }) => (
                        <ValidityFieldInput
                          key={field}
                          labelKey={labelKey}
                          value={editValues[field]}
                          max={protocolParams[VALIDITY_MAX_DAYS[field]]}
                          onChange={(value) => patchEditValue(field, value)}
                          disabled={submitting}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                      <Button variant="outline" onClick={cancelEdit} disabled={submitting}>
                        {t('messages.cancel', 'Cancel')}
                      </Button>
                      <Button onClick={confirmEdit} disabled={submitting || outOfBounds}>
                        {submitting ? <Spinner aria-hidden="true" /> : null}
                        {t('messages.confirm', 'Confirm')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </BlurFade>

          <BlurFade delay={0.1}>
            <Card>
              <CardHeader className="border-b">
                <SectionTitle icon={BracesIcon}>{t('dataview.cs.fields.jsonSchema', 'JSON Schema')}</SectionTitle>
              </CardHeader>
              <CardContent>
                {canonicalJsonSchema.schema ? (
                  <div className="rounded-lg border bg-muted/30">
                    <JsonCodeBlock value={canonicalJsonSchema.schema} className={JSON_BLOCK_CLASS} />
                  </div>
                ) : canonicalJsonSchema.failed ? (
                  <>
                    <WarningLine>{translate('dataview.cs.jsonSchema.stored')}</WarningLine>
                    <div className="rounded-lg border bg-muted/30">
                      <JsonCodeBlock value={credentialSchema.jsonSchema} className={JSON_BLOCK_CLASS} />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2" aria-busy="true">
                    {[72, 56, 64, 40, 52].map((width) => (
                      <Shimmer key={width} className="h-3.5" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </BlurFade>
        </div>

        <ActivityHistorySection history={history} className="mb-0 min-w-0" />
      </div>

      <ModalAction isActive={archiveActive} titleKey={archiveTitleKey} onClose={() => setArchiveActive(false)}>
        {renderActionComponent(archiveMessageType, () => setArchiveActive(false), credentialSchema, refresh)}
      </ModalAction>
    </>
  )
}
