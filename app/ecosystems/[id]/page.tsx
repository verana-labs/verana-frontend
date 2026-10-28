'use client'

import { faBoxArchive, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { ArrowLeftIcon, FileJson2Icon, LanguagesIcon, RotateCwIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM } from '@/config/env'
import AddCredentialSchemaPage from '@/credential-schemas/add/add'
import { useActivityHistory } from '@/hooks/useActivityHistory'
import { useCredentialSchemas } from '@/hooks/useCredentialSchemas'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useLanguageLabel } from '@/lib/language'
import { ActivityHistorySection } from '@/ui/common/activity-history-section'
import { EntityActionButton } from '@/ui/common/capability-button'
import CsSummaryCard from '@/ui/common/cs-summary-card'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import EcosystemHeader from '@/ui/common/ecosystem-header'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import { EmptyState } from '@/ui/common/empty-state'
import { GovernanceFrameworkActions } from '@/ui/common/governance-framework-actions'
import JsonCodeBlock from '@/ui/common/json-code-block'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { ModalAction } from '@/ui/common/modal-action'
import ServiceProviderCard from '@/ui/common/service-provider-card'
import { resolveTranslatable } from '@/ui/dataview/types'
import { actionButtonClass } from '@/ui/ecosystem-detail/action-button-class'
import { CopyButton } from '@/ui/ecosystem-detail/copy-button'
import { EcosystemDetailSkeleton, SchemaCardsSkeleton } from '@/ui/ecosystem-detail/detail-skeleton'
import { EcosystemStatTiles } from '@/ui/ecosystem-detail/stat-tiles'
import { type EcosystemTab, revealTabTrigger, useEcosystemTab } from '@/ui/ecosystem-detail/use-ecosystem-tab'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { TabIndicator } from '@/ui/motion/tab-indicator'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { formatDateTime } from '@/util/util'
import { isValidDID } from '@/util/validations'

const TAB_LABEL_KEYS: Record<EcosystemTab, string> = {
  overview: 'ecosystem.tab.overview',
  governance: 'ecosystem.tab.governance',
  schemas: 'datatable.cs.title',
  activity: 'activity.title',
  json: 'ecosystem.tab.json',
}

const TAB_TRIGGER_CLASS =
  'relative isolate h-10 flex-none rounded-none px-2.5 focus-visible:rounded-md focus-visible:ring-inset sm:px-3 after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent'

function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

function Property({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'mt-1 font-mono text-sm break-all' : 'mt-1 text-sm font-medium'}>{children}</dd>
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
    refetch: refetchCredentialSchemas,
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
  const [addCredentialSchema, setAddCredentialSchema] = useState(false)

  const refreshEcosystem = () => {
    void refetchEcosystem()
    void history.refetch()
  }
  const refreshCredentialSchemas = () => {
    void refetchCredentialSchemas()
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

  const headerMeta = (
    <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-muted-foreground">
      <LanguagesIcon aria-hidden="true" />
      {resolvedLanguage}
    </Badge>
  )

  const headerActions = owner ? (
    <EntityActionButton
      msgType="MsgCreateCredentialSchema"
      icon={faPlus}
      label={t('button.cs.add', 'New Schema')}
      onClick={() => setAddCredentialSchema(true)}
      className={actionButtonClass('default', 'h-9 px-3')}
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
              {tab === value ? (
                <TabIndicator layoutId="ecosystem-detail-tabs" variant="underline" className="bottom-0" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <BlurFade offset={4} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2 className="text-base font-semibold">
                      {t('dataview.ecosystem.sections.basicInformation', 'Basic Information')}
                    </h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                </CardContent>
              </Card>

              <section className="flex flex-col overflow-hidden rounded-xl bg-card text-sm ring-1 ring-foreground/10">
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div>
                    <h2 className="text-base font-semibold">
                      {t('dataview.section.mutable', 'Mutable Configuration')}
                    </h2>
                    {canEdit ? (
                      <p className="mt-1 text-sm text-muted-foreground">{translate('ecosystem.mutable.description')}</p>
                    ) : null}
                  </div>
                  {!editMode ? (
                    <div>
                      <span className="text-xs text-muted-foreground">{t('dataview.ecosystem.fields.did', 'DID')}</span>
                      <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-muted/60 py-2 pr-1.5 pl-3">
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
                  <div className="flex flex-col gap-2 border-t border-border bg-muted/50 px-4 py-3 sm:flex-row sm:justify-end">
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
            </div>

            <ServiceProviderCard did={ecosystem.did} />
          </BlurFade>
        </TabsContent>

        <TabsContent value="governance" className="mt-6">
          <section>
            <SectionHeading
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
                      onParticipants={() => router.push(`/participants/${credentialSchema.id}`)}
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

      {addCredentialSchema ? (
        <ModalAction
          onClose={() => setAddCredentialSchema(false)}
          titleKey="datatable.cs.add"
          isActive={addCredentialSchema}
          classModal="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white dark:bg-surface"
        >
          <AddCredentialSchemaPage
            ecosystemId={Number(id)}
            onCancel={() => setAddCredentialSchema(false)}
            onRefresh={() => {
              refreshCredentialSchemas()
              setAddCredentialSchema(false)
              setTab('schemas')
            }}
          />
        </ModalAction>
      ) : null}
    </>
  )
}
