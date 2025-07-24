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

export default function TrViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;

  const [data, setData] = useState<TrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { notify } = useNotification();

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

        // Define expected shape: either TrData or { tr_entry: TrData }
        const json: unknown = await res.json();
        type ResponseShape = Partial<{ trust_registry: TrData }> & TrData;
        const resp = json as ResponseShape;
        const entry = resp.trust_registry ?? (resp as TrData);
        entry.deposit = formatVNA(entry.deposit, 6);
        entry.language = langs.where('1', entry.language).name;
        entry.role = entry.schemas = entry.created = entry.modified = entry.active_version = undefined;

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

  return (
    <>
      <TitleAndButton
        title={"Trust Registry " + data.did}
        buttonLabel="Back to List"
        to="/tr"
        Icon={ChevronLeftIcon}
      />
      <DataView<TrData> sections={trSections} data={data} id={decodeURIComponent(id)} columnsCount={2} />
    </>
  );
}
