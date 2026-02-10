'use client';

import React, { useState, useEffect } from 'react';
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
import { columnsCsList } from '@/ui/datatable/columnslist/cs';
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
  const { csList, refetch: refetchCSList } = useCSList (id);
  const { dataTR, loading, errorTRData, refetch: refetchTR } = useTrustRegistryData(id);
  const [ addCS, setAddCS ] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState(false);

  const archivedCheckbox = (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={showArchived}
        onChange={(e) => setShowArchived(e.target.checked)}
        className="w-4 h-4 text-primary-600 bg-white dark:bg-surface border-neutral-20 dark:border-neutral-70 rounded focus:ring-2 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {resolveTranslatable({key: "datatable.cs.filter.showArchived"}, translate)}
      </span>
    </label>
  );

  // Refresh data TR
  const [refresh, setRefresh] = useState<string | null>(null);
  useEffect(() => {
    if (!refresh) return;
    console.info('useEffect TRViewPage');
    (async () => {
      if (refresh === 'actionTR') await refetchTR();
      if (refresh === 'actionCS') await refetchCSList();
      setRefresh(null);
    })();
  }, [refresh]);

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
  }, [dataTR, address, csList, id]);

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

      {/* Credential Schemas Section */}
      <DataTable
        tableTitle={resolveTranslatable({key: "datatable.cs.title"}, translate)}
        addTitle={data.controller === address ? resolveTranslatable({key: "button.cs.add"}, translate) : undefined}
        columnsI18n={columnsCsList}
        data={csList.filter(cs =>
          showArchived || cs.archived !== "true"
        )}
        initialPageSize={10}
        onRowClick={(row) => router.push(`/tr/cs/${encodeURIComponent(row.id)}?edit=${data.controller === address}`)}
        defaultSortColumn={'id'}
        showDetailModal={false}
        detailTitle={resolveTranslatable({key: "datatable.tr.detail"}, translate)}
        onAdd={data.controller === address ? () => setAddCS(true) : undefined}
        titleFilter={archivedCheckbox}
      />

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
