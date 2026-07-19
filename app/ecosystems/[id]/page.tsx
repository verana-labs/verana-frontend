'use client'

import { faArrowLeft, faArrowUp, faBoxArchive, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AddCredentialSchemaPage from '@/credential-schemas/add/add'
import { useCredentialSchemas } from '@/hooks/useCredentialSchemas'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useLanguageLabel } from '@/lib/language'
import CsSummaryCard from '@/ui/common/cs-summary-card'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import EcosystemHeader from '@/ui/common/ecosystem-header'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import FieldRow from '@/ui/common/field-row'
import { ModalAction } from '@/ui/common/modal-action'
import ServiceProviderCard from '@/ui/common/service-provider-card'
import { resolveTranslatable } from '@/ui/dataview/types'
import { isValidDID } from '@/util/validations'

type GovernanceFrameworkAction = 'MsgAddGovernanceFrameworkDocument' | 'MsgIncreaseActiveGovernanceFrameworkVersion'

export default function EcosystemViewPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const { corporation, hasOperatorGrant } = useUserCorporation()
  const { ecosystem, errorEcosystem, refetch: refetchEcosystem } = useEcosystemData(id)
  const {
    credentialSchemas,
    errorCredentialSchemas,
    refetch: refetchCredentialSchemas,
  } = useCredentialSchemas(id, false, false)

  const [showArchived, setShowArchived] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editDid, setEditDid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [archiveActive, setArchiveActive] = useState(false)
  const [governanceFrameworkAction, setGovernanceFrameworkAction] = useState<GovernanceFrameworkAction | null>(null)
  const [addCredentialSchema, setAddCredentialSchema] = useState(false)

  const refreshEcosystem = () => {
    void refetchEcosystem()
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

  if (errorEcosystem) {
    return (
      <div className="error-pane">
        {errorEcosystem ||
          (resolveTranslatable({ key: 'error.ecosystem.notfound' }, translate) ?? 'Ecosystem not found')}
      </div>
    )
  }

  if (!ecosystem) {
    return (
      <div className="space-y-6">
        <div className="skeleton-card">
          <div className="skeleton-title mb-6 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="skeleton-text-sm w-1/3" />
                <div className="skeleton-text w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const canManage = corporation?.id === ecosystem.corporationId && hasOperatorGrant
  const isArchived = Boolean(ecosystem.archived)
  const lastVersion = ecosystem.versions.reduce(
    (latest, version) => Math.max(latest, version.version),
    ecosystem.activeVersion
  )
  const canIncreaseGovernanceFramework = canManage && lastVersion > ecosystem.activeVersion
  const archiveMessageType = isArchived ? 'MsgUnarchiveEcosystem' : 'MsgArchiveEcosystem'
  const archiveTitleKey = isArchived
    ? 'dataview.ecosystem.actions.unarchiveEcosystem'
    : 'dataview.ecosystem.actions.archiveEcosystem'
  const visibleSchemas = credentialSchemas.filter((schema) => showArchived || !schema.archived)
  const editIsValid = isValidDID(editDid) && editDid !== ecosystem.did

  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback
  const currentEcosystem = ecosystem

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

  return (
    <>
      <section className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/ecosystems')}
          className="inline-flex items-center text-sm text-neutral-70 hover:text-primary-600 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          <span>{t('button.ecosystem.back', 'Back')}</span>
        </button>
      </section>

      <EcosystemHeader did={ecosystem.did} status={isArchived ? 'ARCHIVED' : undefined} />
      <ServiceProviderCard did={ecosystem.did} />

      <section className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('dataview.ecosystem.sections.basicInformation', 'Basic Information')}
        </h2>
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FieldRow label={t('dataview.ecosystem.fields.id', 'ID')}>
              <p className="text-gray-900 dark:text-white font-medium">{ecosystem.id}</p>
            </FieldRow>
            <FieldRow label={t('dataview.ecosystem.fields.corporationId', 'Corporation ID')}>
              <p className="text-gray-900 dark:text-white font-medium">{ecosystem.corporationId}</p>
            </FieldRow>
            <FieldRow label={t('dataview.ecosystem.fields.language', 'Primary Governance Framework Language')}>
              <p className="text-gray-900 dark:text-white font-medium">{resolvedLanguage}</p>
            </FieldRow>
            <FieldRow label={t('dataview.ecosystem.fields.activeVersion', 'Active GF Version')}>
              <p className="text-gray-900 dark:text-white font-medium">{ecosystem.activeVersion}</p>
            </FieldRow>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {t('dataview.section.mutable', 'Mutable Configuration')}
          </h2>
          {canManage && !editMode ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>{t('dataview.ecosystem.actions.updateEcosystem', 'Edit Configuration')}</span>
              </button>
              <button
                type="button"
                onClick={() => setArchiveActive(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  isArchived ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={faBoxArchive} />
                <span>
                  {isArchived
                    ? t('dataview.ecosystem.actions.unarchiveEcosystem', 'Unarchive')
                    : t('dataview.ecosystem.actions.archiveEcosystem', 'Archive')}
                </span>
              </button>
            </div>
          ) : null}
        </div>
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
          {!editMode ? (
            <FieldRow label={t('dataview.ecosystem.fields.did', 'DID')}>
              <p className="text-gray-900 dark:text-white font-mono font-medium break-all text-sm">{ecosystem.did}</p>
            </FieldRow>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="ecosystem-edit-did"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t('dataview.ecosystem.fields.did', 'DID')}
                </label>
                <input
                  id="ecosystem-edit-did"
                  type="text"
                  value={editDid}
                  onChange={(event) => setEditDid(event.target.value)}
                  disabled={submitting}
                  placeholder="did:method:identifier"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white font-mono text-sm disabled:opacity-60 ${
                    isValidDID(editDid) || editDid === ''
                      ? 'border-neutral-20 dark:border-neutral-70'
                      : 'border-red-500'
                  }`}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium disabled:opacity-60"
                >
                  {t('messages.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmEdit}
                  disabled={submitting || !editIsValid}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-60"
                >
                  {t('messages.confirm', 'Confirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {t('datalist.egf.title', 'Governance Framework Documents')}
          </h2>
          {canManage ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setGovernanceFrameworkAction('MsgAddGovernanceFrameworkDocument')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>{t('dataview.ecosystem.actions.addGovernanceFrameworkDocument', 'Add New Document')}</span>
              </button>
              {canIncreaseGovernanceFramework ? (
                <button
                  type="button"
                  onClick={() => setGovernanceFrameworkAction('MsgIncreaseActiveGovernanceFrameworkVersion')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faArrowUp} />
                  <span>
                    {t(
                      'dataview.ecosystem.actions.increaseActiveGovernanceFrameworkVersion',
                      'Increase Active Version'
                    )}
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <EgfDocumentsTable versions={ecosystem.versions} activeVersion={ecosystem.activeVersion} />
      </section>

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {t('datatable.cs.title', 'Credential Schemas')}
            </h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-20 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('datatable.cs.filter.showArchived', 'Show Archived')}
              </span>
            </label>
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={() => setAddCredentialSchema(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>{t('button.cs.add', 'New Schema')}</span>
            </button>
          ) : null}
        </div>
        {errorCredentialSchemas ? <div className="error-pane mb-4">{errorCredentialSchemas}</div> : null}
        {visibleSchemas.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70">
            {t('datatable.cs.empty', 'No credential schemas')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {visibleSchemas.map((credentialSchema) => (
              <CsSummaryCard
                key={credentialSchema.id}
                credentialSchema={credentialSchema}
                onView={() => router.push(`/credential-schemas/${credentialSchema.id}`)}
                onParticipants={() => router.push(`/participants/${credentialSchema.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <ModalAction isActive={archiveActive} titleKey={archiveTitleKey} onClose={() => setArchiveActive(false)}>
        {renderActionComponent(archiveMessageType, () => setArchiveActive(false), ecosystem, refreshEcosystem)}
      </ModalAction>

      <ModalAction
        isActive={governanceFrameworkAction !== null}
        titleKey={
          governanceFrameworkAction === 'MsgIncreaseActiveGovernanceFrameworkVersion'
            ? 'dataview.ecosystem.actions.increaseActiveGovernanceFrameworkVersion'
            : 'dataview.ecosystem.actions.addGovernanceFrameworkDocument'
        }
        onClose={() => setGovernanceFrameworkAction(null)}
      >
        {governanceFrameworkAction
          ? renderActionComponent(
              governanceFrameworkAction,
              () => setGovernanceFrameworkAction(null),
              { ...ecosystem, lastVersion },
              refreshEcosystem
            )
          : null}
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
            }}
          />
        </ModalAction>
      ) : null}
    </>
  )
}
