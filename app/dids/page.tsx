'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '@/app/ui/common/data-table';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatDate, formatVNA, isExpired, shortenMiddle } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';

interface Did {
  controller: string;
  created: string;
  deposit: string;
  did: string;
  exp: string;
  modified: string;
}

const columns: Column<Did>[] = [
  { header: 'DID', accessor: 'did', filterType: 'text', format: (value) => shortenMiddle(String(value), 30) },
  { header: 'controller', accessor: 'controller', filterType: 'text', format: (value) => { return shortenMiddle(String(value), 25); } },
  { header: 'created', accessor: 'created', filterType: 'text', format: (value) => formatDate(value) },
  { header: 'modified', accessor: 'modified', filterType: 'text', format: (value) => formatDate(value) },
  { header: 'expire', accessor: 'exp', filterType: 'checkbox', filterLabel: 'Expired', filterFn: (value) => isExpired(value), format: (value) => formatDate(value) },
  { header: 'deposit', accessor: 'deposit', filterType: 'text', format: (value) => formatVNA(String(value), 6) },
];

export default function DidsPage() {
  const [dids, setDids] = useState<Did[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { notify } = useNotification();
  const listDIDURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_LIST_DID');

  useEffect(() => {
    const fetchDIDs = async () => {
      try {
        if (listDIDURL) {
          const res = await fetch(listDIDURL);
          const json = await res.json();
          setDids(Array.isArray(json) ? json : json.dids || []);
        }
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
  }, [listDIDURL, notify]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <TitleAndButton
        title="DID Directory"
        buttonLabel="Add DID"
        to="/dids/add"
        Icon={PlusIcon}
      />
      <DataTable
        columns={columns}
        data={dids}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/dids/${encodeURIComponent(row.did)}`)}
      />
    </>
  );
}
