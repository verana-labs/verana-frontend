'use client'

import { faBoxArchive, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import {
  BracesIcon,
  CoinsIcon,
  FingerprintIcon,
  HistoryIcon,
  InfinityIcon,
  type LucideIcon,
  NetworkIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
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
import { isNativePricing, pricingAssetLabel } from '@/lib/pricing-asset'
import { cn } from '@/lib/utils'
import { useProtocolParams } from '@/providers/protocol-params-context'
import { ActivityHistorySection } from '@/ui/common/activity-history-section'
import { CapabilityButton, EntityActionButton } from '@/ui/common/capability-button'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import JsonCodeBlock from '@/ui/common/json-code-block'
import { ModalAction } from '@/ui/common/modal-action'
import { PricingNotice } from '@/ui/common/pricing-notice'
import { StatTile, UnknownStat } from '@/ui/common/stat-tile'
import { type CredentialSchemaData, VALIDITY_MAX_DAYS } from '@/ui/dataview/datasections/cs'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Shimmer } from '@/ui/motion/shimmer'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { SchemaHero, SchemaHeroSkeleton, type SchemaStatus } from '@/ui/participants/schema-hero'
import { SchemaParticipantsPanel } from '@/ui/participants/schema-participants-panel'
import { SCHEMA_TABS, type SchemaTab, useSchemaTab } from '@/ui/participants/use-schema-tab'
import { Button, buttonVariants } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Spinner } from '@/ui/shadcn/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'

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

const TAB_LABEL_KEYS: Record<SchemaTab, string> = {
  overview: 'cs.tab.overview',
  participants: 'cs.tab.participants',
  activity: 'cs.tab.activity',
}

const TAB_TRIGGER_CLASS =
  'relative isolate h-10 flex-none gap-1.5 rounded-none px-2.5 focus-visible:rounded-md focus-visible:ring-inset sm:px-3 after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent'

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

function SchemaFacts({
  schema,
  history,
}: {
  schema: CredentialSchemaData
  history: ReturnType<typeof useActivityHistory>
}) {
  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback
  const native = isNativePricing(schema)
  const latest = history.rows[0]
  const activityValue = history.failed ? (
    <UnknownStat />
  ) : history.loading && history.rows.length === 0 ? (
    <Shimmer className="h-8 w-12" />
  ) : (
    `${history.rows.length}${history.partial ? '+' : ''}`
  )
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatTile
        icon={<CoinsIcon />}
        label={t('dataview.cs.fields.pricingAsset', 'Pricing Asset')}
        value={native ? 'VNA' : (schema.pricingAsset ?? '-')}
        hint={pricingAssetLabel(schema)}
      />
      <StatTile
        icon={<FingerprintIcon />}
        label={t('dataview.cs.fields.digestAlgorithm', 'Digest Algorithm')}
        value={schema.digestAlgorithm ?? '-'}
      />
      <StatTile
        className="col-span-2 sm:col-span-1"
        icon={<HistoryIcon />}
        label={t('activity.title', 'Activity')}
        value={activityValue}
        hint={
          latest
            ? translate('cs.facts.lastChange', { date: new Date(latest.timestamp).toLocaleDateString() })
            : undefined
        }
      />
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
  const { tab, setTab, view, setView } = useSchemaTab()
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
          tab === 'participants' ? null : (
            <Button size="lg" onClick={() => setTab('participants')} className="px-4">
              <NetworkIcon aria-hidden="true" />
              <span>{t('participants.title', 'Participants')}</span>
            </Button>
          )
        }
      />

      {isNativePricing(credentialSchema) ? null : <PricingNotice schema={credentialSchema} className="mb-6" />}

      <Tabs value={tab} onValueChange={setTab} activationMode="manual" className="gap-0">
        <TabsList
          variant="line"
          aria-label={t('cs.tabs.label', 'Credential schema sections')}
          className="w-full justify-start gap-0 overflow-x-auto overflow-y-hidden border-b border-border p-0 [scrollbar-width:none] group-data-horizontal/tabs:h-auto"
        >
          {SCHEMA_TABS.map((value) => (
            <TabsTrigger key={value} value={value} className={TAB_TRIGGER_CLASS}>
              {t(TAB_LABEL_KEYS[value], value)}
              {value === 'activity' && history.rows.length > 0 ? (
                <span className="rounded-full bg-tint-neutral px-1.5 py-px text-[11px] font-medium text-muted-foreground tabular-nums">
                  {history.rows.length}
                  {history.partial ? '+' : ''}
                </span>
              ) : null}
              {tab === value ? (
                <TabIndicator layoutId="schema-detail-tabs" variant="underline" className="bottom-0" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <SchemaFacts schema={credentialSchema} history={history} />
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
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <SchemaParticipantsPanel
            schemaId={id}
            credentialSchema={credentialSchema}
            ecosystem={
              ecosystem
                ? { id: String(ecosystem.id), did: ecosystem.did, corporationId: ecosystem.corporationId }
                : null
            }
            view={view}
            onViewChange={setView}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityHistorySection history={history} className="min-w-0" filterable />
        </TabsContent>
      </Tabs>

      <ModalAction isActive={archiveActive} titleKey={archiveTitleKey} onClose={() => setArchiveActive(false)}>
        {renderActionComponent(archiveMessageType, () => setArchiveActive(false), credentialSchema, refresh)}
      </ModalAction>
    </>
  )
}
