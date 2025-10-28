'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TrData, trSections } from '@/ui/dataview/datasections/tr';
import DataView from '@/ui/common/data-view-columns';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
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

export default function TRViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<TrData | null>(null);
  const [editing, setEditing] = useState(false);

  const actionTR = useActionTR(); 

  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const { csList, refetch: refetchCSList } = useCSList (id);
  const { dataTR, loading, errorTRData, refetch: refetchTR } = useTrustRegistryData(id);

  // Refresh data TR
  const [refresh, setRefresh] = useState<string | null>(null);
  useEffect(() => {
    if (!refresh) return;
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
          let text = `Version ${version.version}: <a href="${doc.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">${doc.url}</a> (${doc.language}) `;
          if (version.version == lastVersion) text = text.concat (`active since ${formatDate(version.active_since)}`);
          else if (version.version > lastVersion) text = text.concat (` draft`);
          else if (version.version < lastVersion) {
            const nextVersion = versionsArr[index + 1];
            if (nextVersion?.active_since) {
              text = text.concat(
                ` from ${formatDate(version.active_since)} to ${formatDate(nextVersion.active_since)}`
              );
            } else {
              text = text.concat(` from ${formatDate(version.active_since)}`);
            }
          }
          lastVersion = version.version > lastVersion ? version.version : lastVersion;
          return version.version === computed.active_version
            ? `<strong>${text}</strong>`
            : text ;
        })
      );
    computed.last_version = lastVersion;

    if (computed.controller === address){
      computed.addGovernanceFrameworkDocument = "MsgAddGovernanceFrameworkDocument";
      computed.increaseActiveGovernanceFrameworkVersion =
        computed.last_version > (computed.active_version ?? 0)
          ? "MsgIncreaseActiveGovernanceFrameworkVersion"
          : undefined;
    }

    const newCS = {
      trId: id, creator: '',
      issuerGrantorValidationValidityPeriod: 0, verifierGrantorValidationValidityPeriod: 0,
      issuerValidationValidityPeriod: 0, verifierValidationValidityPeriod: 0, holderValidationValidityPeriod: 0,
      issuerPermManagementMode: 1, verifierPermManagementMode: 1, jsonSchema: "",
      title: resolveTranslatable({key: "tr.cs.add.title"}, translate), id: ''
      };
    computed.csList =
      computed.controller === address
        ? [newCS, ...(csList ?? [])]
        : (csList ?? []);

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
      <TitleAndButton
        title=  {`${resolveTranslatable({key: "tr.title"}, translate)?? "Trust Registry"}  ${data.did}`}
        buttonLabel={resolveTranslatable({key: "button.tr.back"}, translate)?? "Back to List"}
        to="/tr"
        Icon={ChevronLeftIcon}
      />
      {editing ? (
        <EditableDataView<TrData>
          sectionsI18n={trSections}
          data={data}
          messageType={'MsgUpdateTrustRegistry'}
          id={data.id}
          onSave={ onSave }
          onCancel={() => setEditing(false)}  />
      ) : (
        <DataView<TrData> sectionsI18n={trSections} data={data} id={data.id} columnsCount={2} 
            onEdit={ data.controller === address ? () => setEditing(true) : undefined } 
            setRefresh={setRefresh}/>
      )}
    </>
  );
}
