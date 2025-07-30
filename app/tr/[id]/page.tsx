'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TrData, trSections } from '@/app/types/dataViewTypes';
import DataView from '@/app/ui/common/data-view-columns';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { formatVNA } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';
import langs from 'langs';
import EditableDataView from '@/app/ui/common/data-edit';
import { useActionTR } from '@/app/msg/trust-registry/actionTR';

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

  useEffect(() => {
    if (!id) {
      setError('Missing Tust Registry');
      setLoading(false);
      return;
    }
    const fetchTr = async () => {
      try {
        if (!getURL) throw new Error('API endpoint not configured');

        const url = `${getURL}/get/${decodeURIComponent(id)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        type ResponseShape = Partial<{ trust_registry: TrData }> & TrData;
        const json: unknown = await res.json();
        const resp = json as ResponseShape;
        const entry = resp.trust_registry ?? (resp as TrData);
        entry.deposit = formatVNA(entry.deposit, 6);
        entry.language = langs.where('1', entry.language).name;

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
  }, [id, getURL, notify]);

  if (loading) {
    return <div className="p-6 text-center">Loading Trust Registry details…</div>;
  }
  if (error || !data) {
    return <div className="p-6 text-red-600">Error: {error || 'Trust Registry not found'}</div>;
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
      msgType: 'UpdateTrustRegistry',
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
          id={data.id}
          onSave={ onSave }
          onCancel={() => setEditing(false)}  />
      ) : (
        <>
          <DataView<TrData> sections={trSections} data={data} id={data.id} columnsCount={2} />
          <div className="flex justify-end mt-4">
            <button
              className="px-3 py-1 rounded-md disabled:opacity-40 bg-light-bg dark:bg-dark-bg hover:text-light-selected-text hover:bg-light-selected-bg dark:hover:text-dark-selected-text dark:hover:bg-dark-selected-bg"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          </div>
        </>
      )}
    </>
  );
}
