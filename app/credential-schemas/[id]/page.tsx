'use client'

import { faBoxArchive, faPenToSquare, faSitemap } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCredentialSchemaData } from '@/hooks/useCredentialSchemaData'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { renderActionComponent } from '@/ui/common/data-view-typed'
import EcosystemBreadcrumb from '@/ui/common/ecosystem-breadcrumb'
import JsonCodeBlock from '@/ui/common/json-code-block'
import { ModalAction } from '@/ui/common/modal-action'
import SchemaHeader, { type SchemaStatus } from '@/ui/common/schema-header'
import type { CredentialSchemaData } from '@/ui/dataview/datasections/cs'
import { resolveTranslatable } from '@/ui/dataview/types'

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

function validityValues(schema: CredentialSchemaData): ValidityValues {
  return {
    issuerGrantorValidationValidityPeriod: schema.issuerGrantorValidationValidityPeriod,
    verifierGrantorValidationValidityPeriod: schema.verifierGrantorValidationValidityPeriod,
    issuerValidationValidityPeriod: schema.issuerValidationValidityPeriod,
    verifierValidationValidityPeriod: schema.verifierValidationValidityPeriod,
    holderValidationValidityPeriod: schema.holderValidationValidityPeriod,
  }
}

function ValidityFieldView({ labelKey, value }: { labelKey: string; value: number }) {
  const label = resolveTranslatable({ key: labelKey }, translate) ?? labelKey
  const valueText =
    value === 0
      ? (resolveTranslatable({ key: 'dataview.cs.value.never' }, translate) ?? 'Never expires')
      : (resolveTranslatable({ key: 'dataview.cs.value.days', values: { n: value } }, translate) ?? `${value} days`)
  return (
    <div>
      <span className="text-sm text-neutral-70 block mb-1">{label}</span>
      <p className="text-gray-900 dark:text-white font-medium">{valueText}</p>
    </div>
  )
}

function ValidityFieldInput({
  labelKey,
  value,
  onChange,
  disabled,
}: {
  labelKey: string
  value: number
  onChange: (value: number) => void
  disabled: boolean
}) {
  const label = resolveTranslatable({ key: labelKey }, translate) ?? labelKey
  const days = resolveTranslatable({ key: 'dataview.cs.value.daysShort' }, translate) ?? 'days'
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{`${label} (${days})`}</label>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isFinite(parsed)) onChange(Math.max(0, Math.floor(parsed)))
        }}
        disabled={disabled}
        className="w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white text-sm disabled:opacity-60"
      />
    </div>
  )
}

export default function CredentialSchemaViewPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const { credentialSchema, errorCredentialSchema, refetch: refetchCredentialSchema } = useCredentialSchemaData(id)
  const ecosystemId = credentialSchema ? String(credentialSchema.ecosystemId) : ''
  const { ecosystem } = useEcosystemData(ecosystemId)
  const { corporation, hasOperatorGrant } = useUserCorporation()

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [editValues, setEditValues] = useState<ValidityValues | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [archiveActive, setArchiveActive] = useState(false)

  const refresh = () => {
    void refetchCredentialSchema()
  }
  const { submitTx } = useSubmitTxMsgTypeFromObject(() => setMode('view'), refresh)

  const canManage =
    credentialSchema !== null && ecosystem !== null && corporation?.id === ecosystem.corporationId && hasOperatorGrant

  useEffect(() => {
    if (!canManage && mode === 'edit') {
      setMode('view')
      setEditValues(null)
    }
  }, [canManage, mode])

  if (!credentialSchema) {
    if (errorCredentialSchema) {
      return (
        <div className="error-pane">
          {errorCredentialSchema ||
            (resolveTranslatable({ key: 'error.cs.notfound' }, translate) ?? 'Credential Schema not found')}
        </div>
      )
    }
    return (
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
    )
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

  function patchEditValue(field: ValidityField, value: number) {
    setEditValues((previous) => (previous ? { ...previous, [field]: value } : previous))
  }

  return (
    <>
      {ecosystem ? (
        <EcosystemBreadcrumb ecosystemId={String(ecosystem.id)} ecosystemDid={ecosystem.did} />
      ) : (
        <section className="mb-6">
          <div className="skeleton h-4 w-40" />
        </section>
      )}

      <SchemaHeader
        title={credentialSchema.title ?? `Schema ${credentialSchema.id}`}
        description={credentialSchema.description}
        id={credentialSchema.id}
        status={status}
        issuerOnboardingMode={credentialSchema.issuerOnboardingMode}
        verifierOnboardingMode={credentialSchema.verifierOnboardingMode}
        action={
          <button
            type="button"
            onClick={() => router.push(`/participants/${credentialSchema.id}`)}
            className="inline-flex w-full lg:w-auto items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
          >
            <FontAwesomeIcon icon={faSitemap} />
            <span>{t('participants.title', 'Participants')}</span>
          </button>
        }
      />

      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {t('dataview.section.mutable', 'Mutable Configuration')}
          </h2>
          {canManage && mode === 'view' ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>{t('dataview.cs.button.editConfiguration', 'Edit Configuration')}</span>
              </button>
              <button
                type="button"
                onClick={() => setArchiveActive(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium"
              >
                <FontAwesomeIcon icon={faBoxArchive} />
                <span>
                  {isArchived
                    ? t('dataview.cs.button.unarchive', 'Unarchive')
                    : t('dataview.cs.button.archive', 'Archive')}
                </span>
              </button>
            </div>
          ) : null}
        </div>
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
          {mode === 'view' || !editValues ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALIDITY_FIELDS.map(({ labelKey, field }) => (
                <ValidityFieldView key={field} labelKey={labelKey} value={credentialSchema[field]} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VALIDITY_FIELDS.map(({ labelKey, field }) => (
                  <ValidityFieldInput
                    key={field}
                    labelKey={labelKey}
                    value={editValues[field]}
                    onChange={(value) => patchEditValue(field, value)}
                    disabled={submitting}
                  />
                ))}
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
                  disabled={submitting}
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
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('dataview.cs.fields.jsonSchema', 'JSON Schema')}
        </h2>
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
          <JsonCodeBlock value={credentialSchema.jsonSchema} />
        </div>
      </section>

      <ModalAction isActive={archiveActive} titleKey={archiveTitleKey} onClose={() => setArchiveActive(false)}>
        {renderActionComponent(archiveMessageType, () => setArchiveActive(false), credentialSchema, refresh)}
      </ModalAction>
    </>
  )
}
