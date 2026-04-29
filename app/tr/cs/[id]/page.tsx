'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxArchive, faPenToSquare, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { useChain } from '@cosmos-kit/react';

import JsonCodeBlock from '@/ui/common/json-code-block';
import SchemaHeader, { SchemaStatus } from '@/ui/common/schema-header';
import TrustRegistryBreadcrumb from '@/ui/common/trust-registry-breadcrumb';
import { ModalAction } from '@/ui/common/modal-action';
import { renderActionComponent } from '@/ui/common/data-view-typed';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

import { useCsData } from '@/hooks/useCredentialSchemaData';
import { useTrustRegistryData } from '@/hooks/useTrustRegistryData';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useIndexerEvents } from '@/providers/indexer-events-provider';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { CsData } from '@/ui/dataview/datasections/cs';
import { RefreshState } from '@/msg/util/signerUtil';

type ValidityField = keyof Pick<
  CsData,
  | 'issuerGrantorValidationValidityPeriod'
  | 'verifierGrantorValidationValidityPeriod'
  | 'issuerValidationValidityPeriod'
  | 'verifierValidationValidityPeriod'
  | 'holderValidationValidityPeriod'
>;

const VALIDITY_FIELDS: Array<{ labelKey: string; field: ValidityField }> = [
  { labelKey: 'dataview.cs.fields.issuerGrantorValidationValidityPeriod', field: 'issuerGrantorValidationValidityPeriod' },
  { labelKey: 'dataview.cs.fields.verifierGrantorValidationValidityPeriod', field: 'verifierGrantorValidationValidityPeriod' },
  { labelKey: 'dataview.cs.fields.issuerValidationValidityPeriod', field: 'issuerValidationValidityPeriod' },
  { labelKey: 'dataview.cs.fields.verifierValidationValidityPeriod', field: 'verifierValidationValidityPeriod' },
  { labelKey: 'dataview.cs.fields.holderValidationValidityPeriod', field: 'holderValidationValidityPeriod' },
];

type ValidityValues = Record<ValidityField, number>;

function valuesFromCs(csData: CsData): ValidityValues {
  return {
    issuerGrantorValidationValidityPeriod: Number(csData.issuerGrantorValidationValidityPeriod ?? 0),
    verifierGrantorValidationValidityPeriod: Number(csData.verifierGrantorValidationValidityPeriod ?? 0),
    issuerValidationValidityPeriod: Number(csData.issuerValidationValidityPeriod ?? 0),
    verifierValidationValidityPeriod: Number(csData.verifierValidationValidityPeriod ?? 0),
    holderValidationValidityPeriod: Number(csData.holderValidationValidityPeriod ?? 0),
  };
}

function ValidityFieldView({ labelKey, value }: { labelKey: string; value: number }) {
  const label = resolveTranslatable({ key: labelKey }, translate) ?? labelKey;
  const valueText = value === 0
    ? (resolveTranslatable({ key: 'dataview.cs.value.never' }, translate) ?? 'Never expires')
    : (resolveTranslatable({ key: 'dataview.cs.value.days', values: { n: value } }, translate) ?? `${value} days`);
  return (
    <div>
      <span className="text-sm text-neutral-70 dark:text-neutral-70 block mb-1">{label}</span>
      <p className="text-gray-900 dark:text-white font-medium">{valueText}</p>
    </div>
  );
}

function ValidityFieldInput({
  labelKey, value, onChange, disabled,
}: { labelKey: string; value: number; onChange: (n: number) => void; disabled?: boolean }) {
  const label = resolveTranslatable({ key: labelKey }, translate) ?? labelKey;
  const daysShort = resolveTranslatable({ key: 'dataview.cs.value.daysShort' }, translate) ?? 'days';
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {`${label} (${daysShort})`}
      </label>
      <input
        type="number"
        min={0}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(0);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.max(0, Math.floor(parsed)));
        }}
        disabled={disabled}
        className="w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white text-sm disabled:opacity-60"
      />
    </div>
  );
}

export default function CSViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  const [trController, setTrController] = useState<boolean>(false);
  const [trId, setTrId] = useState<string>('');
  const { dataTR, refetch: refetchTR } = useTrustRegistryData(trId);
  const { csData, errorCS, refetch: refetchCS } = useCsData(id);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editValues, setEditValues] = useState<ValidityValues | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [archiveActive, setArchiveActive] = useState<boolean>(false);
  const [refreshState, setRefreshState] = useState<RefreshState>({});
  const { latestProcessedHeight } = useIndexerEvents();

  const onRefreshAfterTx = (id?: string, txHeight?: number) => {
    setRefreshState({ id, txHeight });
  };

  const { submitTx } = useSubmitTxMsgTypeFromObject(
    () => setMode('view'),
    onRefreshAfterTx,
  );

  useEffect(() => {
    (async () => { await refetchTR(); })();
  }, [trId]);

  useEffect(() => {
    setTrController(!!dataTR?.controller && dataTR.controller === address);
  }, [dataTR, address]);

  useEffect(() => {
    if (refreshState.txHeight == null) return;
    if (latestProcessedHeight < refreshState.txHeight) return;
    (async () => {
      await refetchCS();
      setRefreshState({});
    })();
  }, [refreshState.txHeight, latestProcessedHeight]);

  useEffect(() => {
    if (!csData) return;
    if (trId === '') setTrId(csData.trId as string);
  }, [csData]);

  useEffect(() => {
    if (!trController && mode === 'edit') {
      setMode('view');
      setEditValues(null);
    }
  }, [trController, mode]);

  useEffect(() => {
    if (mode === 'view' && submitting) setSubmitting(false);
  }, [mode, submitting]);

  const isArchived = !!csData?.archived;
  const csStatus: SchemaStatus = isArchived ? 'ARCHIVED' : 'ACTIVE';

  const archiveMsgType = isArchived ? 'MsgUnarchiveCredentialSchema' : 'MsgArchiveCredentialSchema';
  const archiveTitleKey = isArchived
    ? 'dataview.cs.actions.unarchiveCredentialSchema'
    : 'dataview.cs.actions.archiveCredentialSchema';
  const archiveButtonLabel = resolveTranslatable(
    { key: isArchived ? 'dataview.cs.button.unarchive' : 'dataview.cs.button.archive' },
    translate,
  ) ?? (isArchived ? 'Unarchive' : 'Archive');

  const editLabel = resolveTranslatable({ key: 'dataview.cs.button.editConfiguration' }, translate)
    ?? 'Edit Configuration';
  const participantsLabel = resolveTranslatable({ key: 'participants.title' }, translate) ?? 'Participants';
  const mutableLabel = resolveTranslatable({ key: 'dataview.section.mutable' }, translate)
    ?? 'Mutable Configuration';
  const jsonSchemaLabel = resolveTranslatable({ key: 'dataview.cs.fields.jsonSchema' }, translate)
    ?? 'JSON Schema';
  const cancelLabel = resolveTranslatable({ key: 'messages.cancel' }, translate) ?? 'Cancel';
  const confirmLabel = resolveTranslatable({ key: 'messages.confirm' }, translate) ?? 'Confirm';

  function startEdit() {
    if (!csData) return;
    setEditValues(valuesFromCs(csData));
    setMode('edit');
  }

  function cancelEdit() {
    setMode('view');
    setEditValues(null);
  }

  async function confirmEdit() {
    if (!csData || !editValues) return;
    setSubmitting(true);
    try {
      await submitTx('MsgUpdateCredentialSchema', { ...csData, ...editValues });
    } catch {
      setSubmitting(false);
    }
  }

  function patchEditValue(field: ValidityField, value: number) {
    setEditValues((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }

  return (
    <>
      {trId && dataTR?.did ? (
        <TrustRegistryBreadcrumb trId={trId} trDid={dataTR.did as string} />
      ) : (
        <section className="mb-6">
          <div className="skeleton h-4 w-40" />
        </section>
      )}

      {csData ? (
        <>
          <SchemaHeader
            title={csData.title ?? ''}
            description={csData.description}
            id={csData.id}
            status={csStatus}
            issuerPermManagementMode={csData.issuerPermManagementMode}
            verifierPermManagementMode={csData.verifierPermManagementMode}
            action={
              <button
                type="button"
                onClick={() => router.push(`/participants/${csData.id}`)}
                className="inline-flex w-full lg:w-auto items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faSitemap} />
                <span>{participantsLabel}</span>
              </button>
            }
          />

          {/* Mutable Configuration */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {mutableLabel}
              </h2>
              {trController && mode === 'view' ? (
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
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
                  >
                    <FontAwesomeIcon icon={faBoxArchive} />
                    <span>{archiveButtonLabel}</span>
                  </button>
                </div>
              ) : null}
            </div>
            <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
              {mode === 'view' || !editValues ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {VALIDITY_FIELDS.map(({ labelKey, field }) => (
                    <ValidityFieldView
                      key={field}
                      labelKey={labelKey}
                      value={Number(csData[field] ?? 0)}
                    />
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
                        onChange={(v) => patchEditValue(field, v)}
                        disabled={submitting}
                      />
                    ))}
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
                      disabled={submitting}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {confirmLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* JSON Schema */}
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              {jsonSchemaLabel}
            </h2>
            <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
              <JsonCodeBlock value={csData.jsonSchema} />
            </div>
          </section>

          {/* Archive / Unarchive still goes through the existing modal flow,
              spec does not define a dedicated inline path for it. */}
          <ModalAction
            isActive={archiveActive}
            titleKey={archiveTitleKey}
            onClose={() => setArchiveActive(false)}
          >
            {renderActionComponent(archiveMsgType, () => setArchiveActive(false), csData, onRefreshAfterTx)}
          </ModalAction>
        </>
      ) : errorCS ? (
        <div className="error-pane">
          {errorCS || (resolveTranslatable({ key: 'error.cs.notfound' }, translate) ?? 'Credential Schema not found')}
        </div>
      ) : (
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
      )}
    </>
  );
}
