'use client'

import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '@/app/ui/common/data-table';
import { veranaChain } from '@/app/config/veranachain';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatDate, formatVNA, isExpired, shortenMiddle } from '@/app/util/util';

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
    <div
      className="
        min-h-screen
        max-w-screen-xl mx-auto
      "
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-title-light-color dark:text-title-dark-color">
          DID Directory
        </h1>
        <button
          onClick={() => router.push('/dids/add')}
          className="inline-flex items-center text-blue-500 hover:underline p-2"
        >
          <PlusIcon aria-hidden="true" className="h-6 w-6 mr-1" />
          <span>Add DID</span>
        </button>
      </div>
      <DataTable
        columns={columns}
        data={dids}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/dids/${encodeURIComponent(row.did)}`)}
      />
    </div>

  );
}