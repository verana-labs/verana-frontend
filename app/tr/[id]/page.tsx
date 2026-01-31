'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { GfdData, gfdSections, htmlGfd, TrData, trSections } from '@/ui/dataview/datasections/tr';
import DataView from '@/ui/common/data-view-columns';
import TitleAndButton from '@/ui/common/title-and-button';
import EditableDataView from '@/ui/common/data-edit';
import { useActionTR } from '@/msg/actions_hooks/actionTR';
import { useChain } from '@cosmos-kit/react';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useTrustRegistryData } from '@/hooks/useTrustRegistryData';
import { useCSList } from '@/hooks/useCredentialSchemas';
import { formatDate, formatVNA } from '@/util/util';
import langs from 'langs';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { createColumnsCsList } from '@/ui/datatable/columnslist/cs';
import { DataTable } from '@/ui/common/data-table';
import { DataList } from '@/ui/common/data-list';
import { ModalAction } from '@/ui/common/modal-action';
import { useRouter } from 'next/navigation';
import AddCsPage from '../cs/add/add';

export default function TRViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<TrData | null>(null);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const actionTR = useActionTR(); 

  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const { csList: allCsList, refetch: refetchCSList } = useCSList(id, false);

  // Filter schemas client-side based on showArchived state
  const csList = useMemo(() => {
    if (showArchived) {
      return allCsList;
    }
    return allCsList.filter(schema => !schema.archived);
  }, [allCsList, showArchived]);
  const { dataTR, loading, errorTRData, refetch: refetchTR } = useTrustRegistryData(id);
  const [ addCS, setAddCS ] = useState<boolean>(false);

  // Create columns with translated ARCHIVED label
  const archivedLabel = resolveTranslatable({key: "datatable.cs.label.archived"}, translate) ?? 'ARCHIVED';
  const csColumns = useMemo(() => createColumnsCsList(archivedLabel), [archivedLabel]);

  // Refresh data TR
  const [refresh, setRefresh] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    if (!refresh) return;
    try {
      if (refresh === 'actionTR') await refetchTR();
      if (refresh === 'actionCS') await refetchCSList();
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setRefresh(null);
    }
  }, [refresh, refetchTR, refetchCSList]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    if (!dataTR || !address) return;
    const computed = { ...dataTR }; // Clone, don't mutate
    computed.deposit = formatVNA(computed.deposit, 6);
    computed.language = langs.where('1', computed.language).name;
    
    let lastVersion = computed.active_version?? 1;
    computed.docs = (computed.versions ?? [])
      .flatMap((version, index, versionsArr) =>
        (version.documents ?? []).map(doc => {
          let state = "";
          let strState = "";
          if (version.version == lastVersion){
            strState = (`active since ${formatDate(version.active_since)}`);
            state = 'active';
          } 
          else if (version.version > lastVersion){
            strState = (`draft`);
            state = (`draft`);
          } 
          else if (version.version < lastVersion) {
            const nextVersion = versionsArr[index + 1];
            if (nextVersion?.active_since) {
              strState = (
                `from ${formatDate(version.active_since)} to ${formatDate(nextVersion.active_since)}`
              );
            } else {
              strState = (`from ${formatDate(version.active_since)}`);
            }
            state= 'inactive';
          }
          const text = htmlGfd(String(version.version), doc.url, doc.language, state, strState);
          lastVersion = version.version > lastVersion ? version.version : lastVersion;
          return text;
        })
      ).reverse();
    computed.last_version = lastVersion;

    if (computed.controller === address){
      computed.addGovernanceFrameworkDocument = "MsgAddGovernanceFrameworkDocument";
      computed.increaseActiveGovernanceFrameworkVersion =
        computed.last_version >= (computed.active_version ?? 0)
          ? "MsgIncreaseActiveGovernanceFrameworkVersion"
          : undefined;
    }

    // const newCS = {
    //   trId: id, creator: '',
    //   issuerGrantorValidationValidityPeriod: 0, verifierGrantorValidationValidityPeriod: 0,
    //   issuerValidationValidityPeriod: 0, verifierValidationValidityPeriod: 0, holderValidationValidityPeriod: 0,
    //   issuerPermManagementMode: 1, verifierPermManagementMode: 1, jsonSchema: "",
    //   title: resolveTranslatable({key: "tr.cs.add.title"}, translate), id: ''
    //   };
    // computed.csList =
    //   computed.controller === address
    //     ? [newCS, ...(csList ?? [])]
    //     : (csList ?? []);

    setData(computed);
  }, [dataTR, address, id]);

  if (loading &&   !refresh) {
    return <div className="loading-paner">{resolveTranslatable({key: "loading.tr"}, translate)?? "Loading Trust Registry details..."}</div>;
  }
  if (errorTRData || !data) {
    return <div className="error-pane">{errorTRData || (resolveTranslatable({key: "error.tr.notfound"}, translate)?? 'Trust Registry not found')}</div>;
  }

  async function onSave(newData: TrData) {
    const cleaned = {
      ...newData,
      did: newData.did || '',
      aka: newData.aka || '',
      language: newData.language || '',
      id: newData.id || '',
      controller: newData.controller || '',
    };

    await actionTR({
      msgType: 'MsgUpdateTrustRegistry',
      creator: cleaned.controller,
      id: cleaned.id,
      did: cleaned.did,
      aka: cleaned.aka,
    });

    setData(cleaned);
    setEditing(false);
  }

  return (
    <>
      {/* Back Navigation & Back Navigation */}
      <TitleAndButton
        title=  {`${data.did}`}
        buttonLabel={resolveTranslatable({key: "button.tr.back"}, translate)}
        // to="/tr"
        onClick={() => router.back()}
        icon={faArrowLeft}
        backLink= {true}
        description={["Ecosystem trust registry and governance framework management."]}
      />
      {/* Basic Information Section */}
      {editing ? (
      <EditableDataView<TrData>
        sectionsI18n={trSections}
        data={data}
        messageType={'MsgUpdateTrustRegistry'}
        id={data.id}
        onSave={ onSave }
        onCancel={() => setEditing(false)}  />
      ) : (
      <DataView<TrData> 
        sectionsI18n={trSections}
        data={data}
        id={data.id}
        onEdit={ data.controller === address ? () => setEditing(true) : undefined } 
        // onRefresh={setRefresh}
        />
      )}
      {/* EGF Documents Section */}
      <DataList<GfdData>
        sectionsI18n={gfdSections}
        data={data as GfdData}
        listTitle={resolveTranslatable({key: "datalist.egf.title"}, translate)}
        onRefresh={() => setRefresh('actionTR')}
      />

      {/* Credential Schemas Section - Unified header and table */}
      <section id="credential-schemas-section" className="mb-8">
        <div className="data-table-section-div overflow-hidden">
          {/* Table Header with title, checkbox, and button - all on same row */}
          <div className="px-4 sm:px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <h3 className="data-table-title whitespace-nowrap">
                <span className="sm:hidden">{resolveTranslatable({key: "datatable.cs.title.short"}, translate) ?? "Schemas"}</span>
                <span className="hidden sm:inline">{resolveTranslatable({key: "datatable.cs.title"}, translate)}</span>
              </h3>
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Show archived checkbox - on the left of the button */}
                <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-neutral-20 dark:border-neutral-70 rounded focus:ring-primary-500 flex-shrink-0"
                  />
                  <span className="leading-tight">{resolveTranslatable({key: "datatable.cs.filter.showArchived"}, translate) ?? "Show Archived"}</span>
                </label>
                {/* New Schema button - only show if user is controller */}
                {data.controller === address && (
                  <button
                    onClick={() => setAddCS(true)}
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors text-xs sm:text-sm"
                  >
                    <span className="mr-1">+</span>
                    <span className="leading-tight">{resolveTranslatable({key: "button.cs.add"}, translate) ?? "New Schema"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Cards - Custom layout matching reference template */}
          <div className="md:hidden divide-y divide-neutral-20 dark:divide-neutral-70">
            {csList.length === 0 && (
              <div className="text-center py-10 text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "datatable.empty"}, translate) ?? "No results found"}
              </div>
            )}
            {csList.map((row) => (
              <div
                key={row.id}
                onClick={() => router.push(`/tr/cs/${encodeURIComponent(row.id)}?edit=${data.controller === address}`)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${row.archived ? 'line-through decoration-2 decoration-[#763EF0]' : ''}`}
              >
                {/* ID */}
                <p className="text-sm font-medium text-gray-900 dark:text-white">CS-{row.id}</p>
                {/* Title with optional ARCHIVED badge */}
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                  {row.title}
                  {row.archived && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-slate-300 dark:bg-slate-700 dark:text-slate-300 ml-2">
                      {archivedLabel}
                    </span>
                  )}
                </h4>
                {/* Description */}
                {row.description && (
                  <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-3">{row.description}</p>
                )}
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-neutral-70 dark:text-neutral-70">{resolveTranslatable({key: "datatable.cs.header.participants"}, translate)}: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{row.participants ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-70 dark:text-neutral-70">{resolveTranslatable({key: "datatable.cs.header.issued"}, translate)}: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{row.issued ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-70 dark:text-neutral-70">{resolveTranslatable({key: "datatable.cs.header.verified"}, translate)}: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{row.verified ?? '-'}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Mobile pagination info */}
            <div className="px-4 py-4 text-sm text-neutral-70 dark:text-neutral-70">
              {resolveTranslatable({key: "datatable.pagination.showing", values: { count: csList.length }}, translate) ?? `Showing ${csList.length} results`}
            </div>
          </div>

          {/* Desktop Table - hide DataTable's outer wrapper styling */}
          <div className="hidden md:block [&_section]:mb-0 [&_section>div]:border-0 [&_section>div]:rounded-none [&_section>div>div:first-child]:hidden">
            <DataTable
              columnsI18n={csColumns}
              data={csList}
              initialPageSize={10}
              onRowClick={(row) => router.push(`/tr/cs/${encodeURIComponent(row.id)}?edit=${data.controller === address}`)}
              defaultSortColumn={'id'}
              showDetailModal={false}
              detailTitle={resolveTranslatable({key: "datatable.tr.detail"}, translate)}
            />
          </div>
        </div>
      </section>

      {/* render modal add Credential Schema*/}
      {addCS && (
      <ModalAction
        onClose={() => setAddCS(false)}
        titleKey={"datatable.cs.add" }
        isActive={addCS}
        classModal={"relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white dark:bg-surface"}
      >
        <AddCsPage
            onCancel={() => setAddCS(false)}
            onRefresh={() => {
              setRefresh('actionCS');
              setTimeout( () => setAddCS(false), 1000);
            }} 
            trId={Number(id)}
        />
      </ModalAction>
      )}
      
    </>
  );
}
