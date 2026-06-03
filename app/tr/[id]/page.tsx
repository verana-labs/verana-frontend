'use client'

import { useChain } from '@cosmos-kit/react'
import { faArrowLeft, faArrowUp, faBoxArchive, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCSList } from '@/hooks/useCredentialSchemas'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useTrustRegistryData } from '@/hooks/useTrustRegistryData'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useLanguageLabel } from '@/lib/language'
import { RefreshState } from '@/msg/util/signerUtil'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import CsSummaryCard from '@/ui/common/cs-summary-card'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import EcosystemHeader from '@/ui/common/ecosystem-header'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import FieldRow from '@/ui/common/field-row'
import { ModalAction } from '@/ui/common/modal-action'
import ServiceProviderCard from '@/ui/common/service-provider-card'
import { resolveTranslatable } from '@/ui/dataview/types'
import { isValidDID, isValidHttpUrl } from '@/util/validations'

import AddCsPage from '../cs/add/add'

type GfdAction = 'MsgAddGovernanceFrameworkDocument' | 'MsgIncreaseActiveGovernanceFrameworkVersion'

export default function TRViewPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()

  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)

  const { dataTR, errorTRData, refetch: refetchTR } = useTrustRegistryData(id)
  const [showArchived, setShowArchived] = useState(false)
  const { csList, refetch: refetchCSList } = useCSList(id, false, false)

  const [editMode, setEditMode] = useState(false)
  const [editDid, setEditDid] = useState('')
  const [editAka, setEditAka] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [archiveActive, setArchiveActive] = useState(false)
  const [gfdAction, setGfdAction] = useState<GfdAction | null>(null)
  const [addCS, setAddCS] = useState(false)

  const [refresh, setRefresh] = useState<string | null>(null)
  const [refreshState, setRefreshState] = useState<RefreshState>({})
  const { latestProcessedHeight } = useIndexerEvents()

  const onActionTRRefresh = (rid?: string, txHeight?: number) => {
    setRefreshState({ id: rid, txHeight })
    setRefresh('actionTR')
  }

  const onActionCSRefresh = (rid?: string, txHeight?: number) => {
    setRefreshState({ id: rid, txHeight })
    setRefresh('actionCS')
  }

  const { submitTx } = useSubmitTxMsgTypeFromObject(() => {
    setEditMode(false)
    setSubmitting(false)
  }, onActionTRRefresh)

  useEffect(() => {
    if (refreshState.txHeight == null || refresh == null) return
    if (latestProcessedHeight < refreshState.txHeight) return
    ;(async () => {
      if (refresh === 'actionTR') await refetchTR()
      if (refresh === 'actionCS') await refetchCSList()
      setRefreshState({})
      setRefresh(null)
    })()
  }, [refreshState.txHeight, latestProcessedHeight, refresh])

  useEffect(() => {
    if (!dataTR) return
    setEditDid(dataTR.did)
    setEditAka(dataTR.aka)
  }, [dataTR?.did, dataTR?.aka])

  const resolvedLanguage = useLanguageLabel(dataTR?.language)

  if (errorTRData) {
    return (
      <div className="error-pane">
        {errorTRData || (resolveTranslatable({ key: 'error.tr.notfound' }, translate) ?? 'Trust Registry not found')}
      </div>
    )
  }

  if (!dataTR) {
    return (
      <div className="space-y-6">
        <div className="skeleton-card">
          <div className="skeleton-title mb-6 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton-text-sm w-1/3" />
                <div className="skeleton-text w-2/3" />
              </div>
            ))}
          </div>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-title mb-4 w-1/4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row border-b border-gray-100 dark:border-gray-800">
              <div className="skeleton-text w-1/4" />
              <div className="skeleton-text w-1/3" />
              <div className="skeleton-badge" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isOwner = !!dataTR.controller && dataTR.controller === address
  const isArchived = !!dataTR.archived
  const headerStatus = isArchived ? ('ARCHIVED' as const) : undefined

  const lastVersion = (dataTR.versions ?? []).reduce(
    (acc, v) => (v.version > acc ? v.version : acc),
    dataTR.active_version ?? 1
  )
  const canIncreaseEgf = isOwner && lastVersion > (dataTR.active_version ?? 0)

  const archiveMsgType = isArchived ? 'MsgUnarchiveTrustRegistry' : 'MsgArchiveTrustRegistry'
  const archiveTitleKey = isArchived
    ? 'dataview.tr.actions.unarchiveTrustRegistry'
    : 'dataview.tr.actions.archiveTrustRegistry'

  const backLabel = resolveTranslatable({ key: 'button.tr.back' }, translate) ?? 'Back'
  const basicInfoLabel =
    resolveTranslatable({ key: 'dataview.tr.sections.basicInformation' }, translate) ?? 'Basic Information'
  const idLabel = resolveTranslatable({ key: 'dataview.tr.fields.id' }, translate) ?? 'ID'
  const controllerLabel =
    resolveTranslatable({ key: 'dataview.tr.fields.controller' }, translate) ?? 'Controller Corporation'
  const languageLabel =
    resolveTranslatable({ key: 'dataview.tr.fields.language' }, translate) ?? 'Primary Governance Framework Language'
  const activeVersionLabel =
    resolveTranslatable({ key: 'dataview.tr.fields.active_version' }, translate) ?? 'Active GF Version'
  const mutableLabel = resolveTranslatable({ key: 'dataview.section.mutable' }, translate) ?? 'Mutable Configuration'
  const didLabel = resolveTranslatable({ key: 'dataview.tr.fields.did' }, translate) ?? 'DID'
  const akaLabel = resolveTranslatable({ key: 'dataview.tr.fields.aka' }, translate) ?? 'AKA (URI)'
  const editLabel =
    resolveTranslatable({ key: 'dataview.tr.actions.updateTrustRegistry' }, translate) ?? 'Edit Configuration'
  const archiveLabel = resolveTranslatable({ key: 'dataview.tr.actions.archiveTrustRegistry' }, translate) ?? 'Archive'
  const unarchiveLabel =
    resolveTranslatable({ key: 'dataview.tr.actions.unarchiveTrustRegistry' }, translate) ?? 'Unarchive'
  const cancelLabel = resolveTranslatable({ key: 'messages.cancel' }, translate) ?? 'Cancel'
  const confirmLabel = resolveTranslatable({ key: 'messages.confirm' }, translate) ?? 'Confirm'
  const egfLabel = resolveTranslatable({ key: 'datalist.egf.title' }, translate) ?? 'EGF Documents'
  const addEgfLabel =
    resolveTranslatable({ key: 'dataview.tr.actions.addGovernanceFrameworkDocument' }, translate) ??
    'Add New EGF Document'
  const increaseEgfLabel =
    resolveTranslatable({ key: 'dataview.tr.actions.increaseActiveGovernanceFrameworkVersion' }, translate) ??
    'Increase Active EGF'
  const csTitle = resolveTranslatable({ key: 'datatable.cs.title' }, translate) ?? 'Credential Schemas'
  const showArchivedLabel =
    resolveTranslatable({ key: 'datatable.cs.filter.showArchived' }, translate) ?? 'Show Archived'
  const newSchemaLabel = resolveTranslatable({ key: 'button.cs.add' }, translate) ?? 'New Schema'

  const visibleSchemas = csList.filter((item) => showArchived || !item.archived)

  const didIsValid = isValidDID(editDid)
  const akaIsValid = isValidHttpUrl(editAka)
  const editIsValid = didIsValid && akaIsValid && (editDid !== dataTR.did || editAka !== dataTR.aka)

  function startEdit() {
    setEditDid((dataTR?.did as string) ?? '')
    setEditAka((dataTR?.aka as string) ?? '')
    setEditMode(true)
  }

  function cancelEdit() {
    setEditDid((dataTR?.did as string) ?? '')
    setEditAka((dataTR?.aka as string) ?? '')
    setEditMode(false)
  }

  async function confirmEdit() {
    if (!dataTR || !editIsValid) return
    setSubmitting(true)
    try {
      await submitTx('MsgUpdateTrustRegistry', { ...dataTR, did: editDid, aka: editAka })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/tr')}
          className="inline-flex items-center text-sm text-neutral-70 dark:text-neutral-70 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          <span>{backLabel}</span>
        </button>
      </section>

      <EcosystemHeader did={dataTR.did} status={headerStatus} />

      <ServiceProviderCard did={dataTR.did} />

      <section className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">{basicInfoLabel}</h2>
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FieldRow label={idLabel}>
              <p className="text-gray-900 dark:text-white font-medium">{dataTR.id}</p>
            </FieldRow>
            <FieldRow label={controllerLabel}>
              <p className="text-gray-900 dark:text-white font-mono font-medium break-all text-sm">
                {dataTR.controller}
              </p>
            </FieldRow>
            <FieldRow label={languageLabel}>
              <p className="text-gray-900 dark:text-white font-medium">{resolvedLanguage}</p>
            </FieldRow>
            <FieldRow label={activeVersionLabel}>
              <p className="text-gray-900 dark:text-white font-medium">{dataTR.active_version ?? '—'}</p>
            </FieldRow>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{mutableLabel}</h2>
          {isOwner && !editMode ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>{editLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setArchiveActive(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  isArchived ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={faBoxArchive} />
                <span>{isArchived ? unarchiveLabel : archiveLabel}</span>
              </button>
            </div>
          ) : null}
        </div>
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
          {!editMode ? (
            <div className="space-y-4">
              <FieldRow label={didLabel}>
                <p className="text-gray-900 dark:text-white font-mono font-medium break-all text-sm">{dataTR.did}</p>
              </FieldRow>
              <FieldRow label={akaLabel}>
                <p className="text-gray-900 dark:text-white font-medium break-all text-sm">{dataTR.aka}</p>
              </FieldRow>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="tr-edit-did"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {didLabel}
                </label>
                <input
                  id="tr-edit-did"
                  type="text"
                  value={editDid}
                  onChange={(e) => setEditDid(e.target.value)}
                  disabled={submitting}
                  placeholder="did:method:identifier"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white font-mono text-sm disabled:opacity-60 ${
                    didIsValid || editDid === '' ? 'border-neutral-20 dark:border-neutral-70' : 'border-red-500'
                  }`}
                />
              </div>
              <div>
                <label
                  htmlFor="tr-edit-aka"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {akaLabel}
                </label>
                <input
                  id="tr-edit-aka"
                  type="url"
                  value={editAka}
                  onChange={(e) => setEditAka(e.target.value)}
                  disabled={submitting}
                  placeholder="https://example.org"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white text-sm disabled:opacity-60 ${
                    akaIsValid || editAka === '' ? 'border-neutral-20 dark:border-neutral-70' : 'border-red-500'
                  }`}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={confirmEdit}
                  disabled={submitting || !editIsValid}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{egfLabel}</h2>
          {isOwner ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setGfdAction('MsgAddGovernanceFrameworkDocument')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>{addEgfLabel}</span>
              </button>
              {canIncreaseEgf ? (
                <button
                  type="button"
                  onClick={() => setGfdAction('MsgIncreaseActiveGovernanceFrameworkVersion')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowUp} />
                  <span>{increaseEgfLabel}</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <EgfDocumentsTable versions={dataTR.versions ?? []} activeVersion={dataTR.active_version ?? 1} />
      </section>

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{csTitle}</h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-20 dark:border-neutral-70 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{showArchivedLabel}</span>
            </label>
          </div>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setAddCS(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>{newSchemaLabel}</span>
            </button>
          ) : null}
        </div>
        {visibleSchemas.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
            {resolveTranslatable({ key: 'datatable.cs.empty' }, translate) ?? 'No credential schemas'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {visibleSchemas.map((cs) => (
              <CsSummaryCard
                key={cs.id}
                cs={cs}
                onView={() => router.push(`/tr/cs/${cs.id}`)}
                onParticipants={() => router.push(`/participants/${cs.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <ModalAction isActive={archiveActive} titleKey={archiveTitleKey} onClose={() => setArchiveActive(false)}>
        {renderActionComponent(archiveMsgType, () => setArchiveActive(false), dataTR, onActionTRRefresh)}
      </ModalAction>

      <ModalAction
        isActive={gfdAction != null}
        titleKey={
          gfdAction === 'MsgIncreaseActiveGovernanceFrameworkVersion'
            ? 'dataview.tr.actions.increaseActiveGovernanceFrameworkVersion'
            : 'dataview.tr.actions.addGovernanceFrameworkDocument'
        }
        onClose={() => setGfdAction(null)}
      >
        {gfdAction
          ? renderActionComponent(
              gfdAction,
              () => setGfdAction(null),
              { ...dataTR, last_version: lastVersion },
              onActionTRRefresh
            )
          : null}
      </ModalAction>

      {addCS ? (
        <ModalAction
          onClose={() => setAddCS(false)}
          titleKey={'datatable.cs.add'}
          isActive={addCS}
          classModal={
            'relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white dark:bg-surface'
          }
        >
          <AddCsPage
            onCancel={() => setAddCS(false)}
            onRefresh={(rid?: string, txHeight?: number) => {
              onActionCSRefresh(rid, txHeight)
              setAddCS(false)
            }}
            trId={Number(id)}
          />
        </ModalAction>
      ) : null}
    </>
  )
}
