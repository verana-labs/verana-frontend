'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TrData, trSections } from '@/app/types/dataViewTypes';
import DataView from '@/app/ui/common/data-view-columns';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { formatVNA, formatDate } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';
import langs from 'langs';
import EditableDataView from '@/app/ui/common/data-edit';
import { useActionTR } from '@/app/msg/trust-registry/actionTR';
import { useChain } from '@cosmos-kit/react';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useCSList } from '@/app/hooks/useCredentialSchemas';

export default function TrViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;

  const [data, setData] = useState<TrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const { notify } = useNotification();
  const actionTR = useActionTR(); 

  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const { csList } = useCSList (id);

  useEffect(() => {
    if (!id) {
      setError('Missing Tust Registry');
      setLoading(false);
      return;
    }
    const fetchTr = async () => {
      try {
        if (!getURL) throw new Error('API endpoint not configured');

        const url = `${getURL}/get/${id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        type ResponseShape = Partial<{ trust_registry: TrData }> & TrData;
        const json: unknown = await res.json();
        const resp = json as ResponseShape;
        const entry = resp.trust_registry ?? (resp as TrData);
        entry.deposit = formatVNA(entry.deposit, 6);
        entry.language = langs.where('1', entry.language).name;
        let lastVersion = entry.active_version?? 1;
        entry.docs = (entry.versions ?? [])
          .flatMap(version =>
            (version.documents ?? []).map(doc => {
              const text = `Version ${version.version}: ${doc.url} (${doc.language}) active since ${formatDate(version.active_since)}`;
              lastVersion = version.version > lastVersion ? version.version : lastVersion;
              return version.version === entry.active_version
                ? `<strong>${text}</strong>`
                : text ;
            })
          );
        entry.last_version = lastVersion;
        if (entry.controller === address){
          entry.addGovernanceFrameworkDocument = "MsgAddGovernanceFrameworkDocument";
          entry.increaseActiveGovernanceFrameworkVersion =
            entry.last_version > (entry.active_version ?? 0)
              ? "MsgIncreaseActiveGovernanceFrameworkVersion"
              : null;
        }
        else {
          entry.addGovernanceFrameworkDocument = null;
          entry.increaseActiveGovernanceFrameworkVersion = null;
        }
        // const csWithTitle = (csList ?? []).map((cs) => {
        //   let schema: any = {};
        //   try {
        //     schema = JSON.parse(cs.jsonSchema); // parse the whole JSON string
        //   } catch {
        //     schema = {};
        //   }
        //   return {
        //     ...cs,
        //     title: (schema.description ?? schema.title ?? "Schema") + " (id: " + cs.id + ")",
        //   };
        // });
        if (entry.controller === address && csList ){
           csList.unshift({
            trId: id, creator: '',
            issuerGrantorValidationValidityPeriod: 0, verifierGrantorValidationValidityPeriod: 0,
            issuerValidationValidityPeriod: 0, verifierValidationValidityPeriod: 0, holderValidationValidityPeriod: 0,
            issuerPermManagementMode: 1, verifierPermManagementMode: 1, jsonSchema: "",
            title: "New Credential Schema", id: '',
            updateCredentialSchema: null, archiveCredentialSchema: null
          });
        }
        entry.csList = csList;
        setData(entry);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        notify(
          message,
          'error',
          'Error fetching Trust Registry'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTr();
  }, [id, getURL, address, csList]);

  if (loading) {
    return <div className="loading-paner">Loading Trust Registry details…</div>;
  }
  if (error || !data) {
    return <div className="error-pane">Error: {error || 'Trust Registry not found'}</div>;
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
    notify('Trust Registry updated!', 'success');
  }

  return (
    <>
      <TitleAndButton
        title={"Trust Registry " + data.did}
        buttonLabel="Back to List"
        to="/tr"
        Icon={ChevronLeftIcon}
      />
      {editing ? (
        <EditableDataView<TrData>
          sections={trSections}
          data={data}
          messageType={'MsgUpdateTrustRegistry'}
          id={data.id}
          onSave={ onSave }
          onCancel={() => setEditing(false)}  />
      ) : (
        <DataView<TrData> sections={trSections} data={data} id={data.id} columnsCount={2} 
            onEdit={ data.controller === address ? () => setEditing(true) : undefined } />
      )}
    </>
  );
}
