'use client'

import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '@/app/ui/common/data-table';
import { useVeranaChain } from "@/app/config/useVeranaChain";
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatDate, formatVNA, isExpired, shortenMiddle } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';

interface Did {
  controller: string,
  created: string,
  deposit: string,
  did: string,
  exp: string,
  modified: string
}

const columns: Column<Did>[] = [
  { header: 'DID', accessor: 'did', filterType: 'text', format: (value) => shortenMiddle(String(value), 30) },
  { header: 'controller', accessor: 'controller', filterType: 'text', format: (value) => {return shortenMiddle(String(value), 25)} },
  { header: 'created', accessor: 'created', filterType: 'text', format: (value) => formatDate(value) },
  { header: 'modified', accessor: 'modified', filterType: 'text', format: (value) => formatDate(value) },
  { header: 'expire', accessor: 'exp', filterType: 'checkbox', filterLabel: 'Expired', filterFn: (value) => isExpired(value), format: (value) => formatDate(value) },
  { header: 'deposit', accessor: 'deposit', filterType: 'text', format: (value) => formatVNA(String(value), 6) },
];

export default function DidsPage() {

  const veranaChain = useVeranaChain();

  const [dids, setDids] = useState<Did[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (veranaChain.apis && veranaChain.apis.rest && veranaChain.apis.rest[0].address) {
      fetch(veranaChain.apis.rest[0].address+ '/dd/v1/list')
      .then(res => res.json())
      .then((json) => setDids(Array.isArray(json) ? json : json.dids || []))
      .catch(console.error)
      .finally(() => setLoading(false))
    }
  }, [])

  if (loading) return <p>Loading...</p>

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