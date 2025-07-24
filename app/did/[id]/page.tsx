'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DidData, didSections } from '@/app/types/dataViewTypes';
import DataView from '@/app/ui/common/data-view-columns';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { formatVNA } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';

export default function DidViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID;

  const [data, setData] = useState<DidData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { notify } = useNotification();

  useEffect(() => {
    if (!id) {
      setError('Missing DID');
      setLoading(false);
      return;
    }
    const fetchDid = async () => {
      try {
        if (!getURL) throw new Error('API endpoint not configured');

        const url = `${getURL}/get/${decodeURIComponent(id)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        // Define expected shape: either DidData or { did_entry: DidData }
        const json: unknown = await res.json();
        type ResponseShape = Partial<{ did_entry: DidData }> & DidData;
        const resp = json as ResponseShape;
        const entry = resp.did_entry ?? (resp as DidData);
        entry.deposit = formatVNA(entry.deposit, 6);
        entry.renewDID = 'RenewDID';
        entry.touchDID = 'TouchDID';
        entry.removeDID = 'RemoveDID';
        setData(entry);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        notify(
          message,
          'error',
          'Error fetching DID'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDid();
  }, [id, getURL, notify]);

  if (loading) {
    return <div className="p-6 text-center">Loading DID details…</div>;
  }
  if (error || !data) {
    return <div className="p-6 text-red-600">Error: {error || 'DID not found'}</div>;
  }

  return (
    <>
      <TitleAndButton
        title={"DID " + data.did}
        buttonLabel="Back to Directory"
        to="/did"
        Icon={ChevronLeftIcon}
      />
      <DataView<DidData> sections={didSections} data={data} id={decodeURIComponent(id)} columnsCount={2} />
    </>
  );
}
