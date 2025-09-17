'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/app/ui/common/data-table';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';
import { columnsDIDList, DIDList } from '@/app/types/dataTableTypes';

export default function DIDPage() {
  const [dids, setDIDs] = useState<DIDList[]>([]);
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
          setDIDs(Array.isArray(json) ? json : json.dids || []);
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
        columns={columnsDIDList}
        data={dids}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/did/${encodeURIComponent(row.did)}`)}
        description={["The DID directory is a public database of Decentralized Identifiers (DIDs) that is used by crawlers to index the metadata of the services provided by these DIDs, if they comply with the Verifiable Trust specification. Indexed DIDs are then searchable in search.verana.io and in others Verifiable Trust search engines.",
          "Any participant can register a DID in the DID directory by executing a transaction in the Verana Network."]}
        defaultSortColumn={'modified'}
      />
    </>
  );
}
