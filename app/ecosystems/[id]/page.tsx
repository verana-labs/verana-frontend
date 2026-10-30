'use client'

import { faBoxArchive, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import {
  ArrowLeftIcon,
  FileJson2Icon,
  InfoIcon,
  LanguagesIcon,
  RotateCwIcon,
  ScrollTextIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM } from '@/config/env'
import { useActivityHistory } from '@/hooks/useActivityHistory'
import { useCredentialSchemas } from '@/hooks/useCredentialSchemas'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useLanguageLabel } from '@/lib/language'
import { ActivityHistorySection } from '@/ui/common/activity-history-section'
import { BlockCard, BlockHeader } from '@/ui/common/block-card'
import { EntityActionButton } from '@/ui/common/capability-button'
import CsSummaryCard from '@/ui/common/cs-summary-card'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import EcosystemHeader from '@/ui/common/ecosystem-header'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import { EmptyState } from '@/ui/common/empty-state'
import { GovernanceFrameworkActions } from '@/ui/common/governance-framework-actions'
import JsonCodeBlock from '@/ui/common/json-code-block'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { KpiStat } from '@/ui/common/kpi-stat'
import { ModalAction } from '@/ui/common/modal-action'
import ServiceProviderCard from '@/ui/common/service-provider-card'
import { ToneTag } from '@/ui/common/tone-tag'
import { resolveTranslatable } from '@/ui/dataview/types'
import { actionButtonClass } from '@/ui/ecosystem-detail/action-button-class'
import { CopyButton } from '@/ui/ecosystem-detail/copy-button'
import { EcosystemDetailSkeleton, SchemaCardsSkeleton } from '@/ui/ecosystem-detail/detail-skeleton'
import { EcosystemParticipantsTab } from '@/ui/ecosystem-detail/participants-tab'
import { EcosystemStatTiles } from '@/ui/ecosystem-detail/stat-tiles'
import { type EcosystemTab, revealTabTrigger, useEcosystemTab } from '@/ui/ecosystem-detail/use-ecosystem-tab'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { formatDateTime, formatNumber, formatVNAFromUVNA, participantCardHref } from '@/util/util'
import { isValidDID } from '@/util/validations'

const TAB_LABEL_KEYS: Record<EcosystemTab, string> = {
  overview: 'ecosystem.tab.overview',
  governance: 'ecosystem.tab.governance',
  schemas: 'datatable.cs.title',
  participants: 'participants.title',
  activity: 'activity.title',
  json: 'ecosystem.tab.json',
}

const TAB_TRIGGER_CLASS =
  'relative isolate h-10 flex-none rounded-none px-2.5 focus-visible:rounded-md focus-visible:ring-inset sm:px-3 after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent'

function SectionHeading({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <BlockHeader icon={icon} title={title} caption={description} className="min-w-0 flex-1" />
      {action}
    </div>
  )
}

function TabCount({ value, active }: { value: number | undefined; active: boolean }) {
  if (value === undefined) return null
  return (
    <span
      className={
        active
          ? 'ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tint-accent px-1.5 text-[11px] font-semibold text-primary tabular-nums'
          : 'ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tint-neutral px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums'
      }
    >
      {formatNumber(value, true, true)}
    </span>
  )
}

function Property({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          mono ? 'mt-1 font-mono text-sm break-all' : 'mt-1 text-sm font-medium tracking-[-0.01em] tabular-nums'
        }
      >
        {children}
      </dd>
    </div>
  )
}

export default function EcosystemViewPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const [tab, setTab] = useEcosystemTab()
  const { actingCorporation } = useUserCorporation()
  const { ecosystem, errorEcosystem, refetch: refetchEcosystem } = useEcosystemData(id)
  const history = useActivityHistory(
    VERANA_REST_ENDPOINT_ECOSYSTEM && id ? `${VERANA_REST_ENDPOINT_ECOSYSTEM}/history/${id}` : undefined
  )
  const {
    credentialSchemas,
    loading: schemasLoading,
    errorCredentialSchemas,
    hasNext: schemasHasNext,
    hasPrevious: schemasHasPrevious,
    nextPage: schemasNextPage,
    previousPage: schemasPreviousPage,
  } = useCredentialSchemas(id, false, false)

  const [showArchived, setShowArchived] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editDid, setEditDid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [archiveActive, setArchiveActive] = useState(false)

  const refreshEcosystem = () => {
    void refetchEcosystem()
    void history.refetch()
  }

  const { submitTx } = useSubmitTxMsgTypeFromObject(() => {
    setEditMode(false)
    setSubmitting(false)
  }, refreshEcosystem)

  useEffect(() => {
    if (ecosystem) setEditDid(ecosystem.did)
  }, [ecosystem])

  const resolvedLanguage = useLanguageLabel(ecosystem?.language)
  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

  const backButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => router.push('/ecosystems')}
      className="mb-4 -ml-2 text-muted-foreground"
    >
      <ArrowLeftIcon aria-hidden="true" />
      {t('button.ecosystem.back', 'Back')}
    </Button>
  )

  if (errorEcosystem) {
    const notFound = errorEcosystem.startsWith('Error 404')
    return (
      <>
        {backButton}
        <div className="error-pane">
          <p className="min-w-0 flex-1 break-words">
            {errorEcosystem ||
              (resolveTranslatable({ key: 'error.ecosystem.notfound' }, translate) ?? 'Ecosystem not found')}
          </p>
          {notFound ? null : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetchEcosystem()}
              className="-my-1 shrink-0 text-foreground"
            >
              <RotateCwIcon aria-hidden="true" />
              {translate('ecosystems.retry')}
            </Button>
          )}
        </div>
      </>
    )
  }

  if (!ecosystem) return <EcosystemDetailSkeleton />

  const owner = actingCorporation?.corporation.id === ecosystem.corporationId
  const isArchived = Boolean(ecosystem.archived)
  const archiveMessageType = isArchived ? 'MsgUnarchiveEcosystem' : 'MsgArchiveEcosystem'
  const archiveTitleKey = isArchived
    ? 'dataview.ecosystem.actions.unarchiveEcosystem'
    : 'dataview.ecosystem.actions.archiveEcosystem'
  const visibleSchemas = credentialSchemas.filter((schema) => showArchived || !schema.archived)
  const editIsValid = isValidDID(editDid) && editDid !== ecosystem.did
  const didInvalid = editDid !== '' && !isValidDID(editDid)
  const currentEcosystem = ecosystem
  const canEdit = owner || editMode

  function startEdit() {
    setEditDid(currentEcosystem.did)
    setEditMode(true)
  }

  function cancelEdit() {
    setEditDid(currentEcosystem.did)
    setEditMode(false)
  }

  async function confirmEdit() {
    if (!editIsValid) return
    setSubmitting(true)
    try {
      await submitTx('MsgUpdateEcosystem', { id: currentEcosystem.id, did: editDid })
    } finally {
      setSubmitting(false)
    }
  }

  const activeDocuments = ecosystem.versions.find((version) => version.version === ecosystem.activeVersion)?.documents
  const draftVersions = ecosystem.versions.filter((version) => version.version > ecosystem.activeVersion).length
  const documentCount = ecosystem.versions.reduce((total, version) => total + version.documents.length, 0)
  const schemasPaged = schemasHasNext || schemasHasPrevious
  const schemaCount =
    !schemasLoading && !schemasPaged ? visibleSchemas.length : showArchived ? undefined : ecosystem.activeSchemas
  const tabCounts: Partial<Record<EcosystemTab, number>> = {
    governance: documentCount,
    schemas: schemaCount,
  }

  const headerMeta = (
    <>
      <ToneTag className="h-6">
        <span className="inline-flex items-center gap-1.5">
          <LanguagesIcon aria-hidden="true" className="size-3.5" />
          {resolvedLanguage}
        </span>
      </ToneTag>
      {ecosystem.activeVersion > 0 ? (
        <ToneTag tone="accent" dot className="h-6">
          {translate('ecosystem.hero.version', { version: ecosystem.activeVersion })}
        </ToneTag>
      ) : null}
      {owner ? <ToneTag className="h-6">{t('ecosystems.owned', 'Owned')}</ToneTag> : null}
    </>
  )

  const headerAside = (
    <KpiStat
      label={t('datatable.cs.card.trustValue', 'Trust Value')}
      value={formatVNAFromUVNA(ecosystem.weight == null ? null : String(ecosystem.weight))}
      stat="trust-value"
      className="min-w-0 border-border/70 md:min-w-48 md:border-s md:ps-6 md:text-end [&>div]:md:justify-end"
    />
  )

  const headerActions = owner ? (
    <EntityActionButton
      msgType="MsgCreateCredentialSchema"
      icon={faPlus}
      label={t('button.cs.add', 'New Schema')}
      onClick={() => router.push(`/credential-schemas/add?ecosystem=${encodeURIComponent(String(id))}`)}
      className={actionButtonClass('default', 'h-9 px-3 [&>svg:last-child]:text-primary-foreground/80')}
    />
  ) : null

  return (
    <>
      {backButton}

      <BlurFade>
        <EcosystemHeader
          did={ecosystem.did}
          status={isArchived ? 'ARCHIVED' : undefined}
          meta={headerMeta}
          actions={headerActions}
          aside={headerAside}
        />
      </BlurFade>

      <EcosystemStatTiles ecosystem={ecosystem} className="mb-8" />

      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <TabsList
          variant="line"
          aria-label={translate('ecosystem.tabs.label')}
          className="w-full justify-start gap-0 overflow-x-auto overflow-y-hidden border-b border-border p-0 [scrollbar-width:none] group-data-horizontal/tabs:h-auto max-md:pr-10 max-md:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]"
        >
          {(Object.keys(TAB_LABEL_KEYS) as EcosystemTab[]).map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className={TAB_TRIGGER_CLASS}
              ref={tab === value ? revealTabTrigger : undefined}
            >
              {translate(TAB_LABEL_KEYS[value])}
              <TabCount value={tabCounts[value]} active={tab === value} />
              {tab === value ? (
                <TabIndicator layoutId="ecosystem-detail-tabs" variant="underline" className="bottom-0" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <BlurFade offset={4} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <BlockCard
                icon={<InfoIcon />}
                title={t('dataview.ecosystem.sections.basicInformation', 'Basic Information')}
                pattern
              >
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pt-1">
                  <Property label={t('dataview.ecosystem.fields.id', 'ID')}>{ecosystem.id}</Property>
                  <Property label={t('dataview.ecosystem.fields.corporationId', 'Corporation ID')}>
                    {ecosystem.corporationId}
                  </Property>
                  <Property label={t('dataview.ecosystem.fields.language', 'Primary Governance Framework Language')}>
                    {resolvedLanguage}
                  </Property>
                  <Property label={t('dataview.ecosystem.fields.activeVersion', 'Active GF Version')}>
                    {ecosystem.activeVersion}
                  </Property>
                  <Property label={t('dataview.ecosystem.fields.created', 'Created')}>
                    {formatDateTime(ecosystem.created)}
                  </Property>
                  <Property label={t('dataview.ecosystem.fields.modified', 'Modified')}>
                    {formatDateTime(ecosystem.modified)}
                  </Property>
                </dl>
              </BlockCard>

              <section className="flex flex-col overflow-hidden rounded-xl bg-card text-sm shadow-card">
                <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                  <BlockHeader
                    icon={<SlidersHorizontalIcon />}
                    title={t('dataview.section.mutable', 'Mutable Configuration')}
                    caption={canEdit ? translate('ecosystem.mutable.description') : undefined}
                  />
                  {!editMode ? (
                    <div>
                      <span className="text-xs text-muted-foreground">{t('dataview.ecosystem.fields.did', 'DID')}</span>
                      <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-tint-neutral py-2 pr-1.5 pl-3 ring-1 ring-border/60">
                        <p className="min-w-0 flex-1 py-0.5 font-mono text-sm break-all">{ecosystem.did}</p>
                        <CopyButton value={ecosystem.did} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="ecosystem-edit-did">{t('dataview.ecosystem.fields.did', 'DID')}</Label>
                      <Input
                        id="ecosystem-edit-did"
                        type="text"
                        value={editDid}
                        onChange={(event) => setEditDid(event.target.value)}
                        disabled={submitting}
                        placeholder="did:method:identifier"
                        aria-invalid={didInvalid || undefined}
                        aria-describedby={didInvalid ? 'ecosystem-edit-did-error' : undefined}
                        className="h-9 font-mono"
                      />
                      {didInvalid ? (
                        <p id="ecosystem-edit-did-error" className="text-xs text-destructive">
                          {translate('ecosystem.mutable.didInvalid')}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
                {canEdit ? (
                  <div className="flex flex-col gap-2 border-t border-border/70 bg-muted/40 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
                    {editMode ? (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={cancelEdit} disabled={submitting}>
                          {t('messages.cancel', 'Cancel')}
                        </Button>
                        <Button type="button" onClick={confirmEdit} disabled={submitting || !editIsValid}>
                          {t('messages.confirm', 'Confirm')}
                        </Button>
                      </div>
                    ) : owner ? (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                        <EntityActionButton
                          msgType="MsgUpdateEcosystem"
                          icon={faPenToSquare}
                          label={t('dataview.ecosystem.actions.updateEcosystem', 'Edit Configuration')}
                          onClick={startEdit}
                          className={actionButtonClass('outline')}
                        />
                        <EntityActionButton
                          msgType={archiveMessageType}
                          icon={faBoxArchive}
                          label={
                            isArchived
                              ? t('dataview.ecosystem.actions.unarchiveEcosystem', 'Unarchive')
                              : t('dataview.ecosystem.actions.archiveEcosystem', 'Archive')
                          }
                          onClick={() => setArchiveActive(true)}
                          className={actionButtonClass(isArchived ? 'destructive' : 'outline')}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <BlockCard
                icon={<ScrollTextIcon />}
                title={t('datalist.egf.title', 'Governance Framework Documents')}
                link={{
                  href: `/ecosystems/${encodeURIComponent(ecosystem.id)}?tab=governance`,
                  label: translate('dashboard.ecosystems.viewAll'),
                }}
                pattern
                className="lg:col-span-2 xl:col-span-1"
              >
                <div className="grid grid-cols-3 gap-4 pt-1">
                  <KpiStat
                    size="sm"
                    label={t('datalist.egf.header.version', 'Version')}
                    value={ecosystem.activeVersion > 0 ? `v${ecosystem.activeVersion}` : '—'}
                  />
                  <KpiStat
                    size="sm"
                    label={translate('ecosystem.governance.summary.documents')}
                    value={formatNumber(documentCount, true, true)}
                  />
                  <KpiStat
                    size="sm"
                    label={translate('ecosystem.governance.summary.drafts')}
                    value={formatNumber(draftVersions, true, true)}
                  />
                </div>
                {activeDocuments && activeDocuments.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/70 pt-4">
                    {activeDocuments.map((document) => (
                      <ToneTag key={document.id} tone="success" dot className="uppercase">
                        {document.language}
                      </ToneTag>
                    ))}
                  </div>
                ) : null}
              </BlockCard>
            </div>

            <ServiceProviderCard did={ecosystem.did} />
          </BlurFade>
        </TabsContent>

        <TabsContent value="governance" className="mt-6">
          <section>
            <SectionHeading
              icon={<ScrollTextIcon />}
              title={t('datalist.egf.title', 'Governance Framework Documents')}
              description={translate('ecosystem.governance.description')}
              action={
                owner ? (
                  <GovernanceFrameworkActions
                    target={{
                      owner: { kind: 'ecosystem', id: ecosystem.id },
                      language: ecosystem.language,
                      activeVersion: ecosystem.activeVersion,
                      versions: ecosystem.versions,
                    }}
                    onRefresh={refreshEcosystem}
                    primaryVariant="outline"
                  />
                ) : null
              }
            />
            <BlurFade offset={4}>
              <EgfDocumentsTable versions={ecosystem.versions} activeVersion={ecosystem.activeVersion} />
            </BlurFade>
          </section>
        </TabsContent>

        <TabsContent value="schemas" className="mt-6">
          <section>
            <SectionHeading
              icon={<FileJson2Icon />}
              title={t('datatable.cs.title', 'Credential Schemas')}
              description={translate('datatable.cs.description')}
              action={
                <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(event) => setShowArchived(event.target.checked)}
                    className="size-4 rounded border-input accent-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <span>{t('datatable.cs.filter.showArchived', 'Show Archived')}</span>
                </label>
              }
            />
            {errorCredentialSchemas ? <div className="error-pane mb-4">{errorCredentialSchemas}</div> : null}
            {schemasLoading && credentialSchemas.length === 0 ? (
              <SchemaCardsSkeleton />
            ) : visibleSchemas.length === 0 ? (
              <EmptyState
                icon={<FileJson2Icon />}
                title={t('datatable.cs.empty', 'No credential schemas')}
                className="bg-card py-12"
              />
            ) : (
              <Stagger as="ul" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleSchemas.map((credentialSchema) => (
                  <StaggerItem as="li" key={credentialSchema.id} className="min-w-0">
                    <CsSummaryCard
                      credentialSchema={credentialSchema}
                      onView={() => router.push(`/credential-schemas/${credentialSchema.id}`)}
                      onParticipants={() => router.push(participantCardHref(credentialSchema.id))}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
            <KeysetPagination
              showing={visibleSchemas.length}
              itemsLabel={t('datatable.cs.title', 'Credential Schemas')}
              hasPrevious={schemasHasPrevious}
              hasNext={schemasHasNext}
              onPrevious={schemasPreviousPage}
              onNext={schemasNextPage}
            />
          </section>
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <BlurFade offset={4}>
            <EcosystemParticipantsTab
              schemas={credentialSchemas}
              schemasPartial={schemasPaged}
              schemasLoading={schemasLoading && credentialSchemas.length === 0}
              active={tab === 'participants'}
            />
          </BlurFade>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <BlurFade offset={4}>
            <ActivityHistorySection history={history} />
          </BlurFade>
        </TabsContent>

        <TabsContent value="json" className="mt-6">
          <BlurFade offset={4}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="text-base font-semibold">{translate('ecosystem.json.title')}</h2>
                </CardTitle>
                <CardDescription>{translate('ecosystem.json.description', { id: ecosystem.id })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[36rem] overflow-auto rounded-lg border border-border bg-muted/40">
                  <JsonCodeBlock value={ecosystem} />
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </TabsContent>
      </Tabs>

      <ModalAction isActive={archiveActive} titleKey={archiveTitleKey} onClose={() => setArchiveActive(false)}>
        {renderActionComponent(archiveMessageType, () => setArchiveActive(false), ecosystem, refreshEcosystem)}
      </ModalAction>
    </>
  )
}
