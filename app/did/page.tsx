'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/app/ui/common/data-table';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';
import { columnsDidList, DidList } from '@/app/types/dataTableTypes';

export default function DidPage() {
  const [dids, setDids] = useState<DidList[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { notify } = useNotification();
  const listURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID;

  useEffect(() => {
    const fetchDIDs = async () => {
      try {
          if (!listURL) throw new Error('API endpoint not configured');
          
          const res = await fetch(listURL + '/list');
          const json = await res.json();
          setDids(Array.isArray(json) ? json : json.dids || []);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          'Error fetching DIDs'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDIDs();
  }, [listURL, notify]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <TitleAndButton
        title="DID Directory"
        buttonLabel="Add DID"
        to="/did/add"
        Icon={PlusIcon}
      />
      <DataTable
        columns={columnsDidList}
        data={dids}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/did/${encodeURIComponent(row.did)}`)}
      />
    </>
  );
}
