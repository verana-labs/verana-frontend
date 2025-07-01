'use client'

import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '@/app/ui/common/data-table';
import { veranaChain } from '@/app/config/veranachain';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Did {
  controller: string,
  created: string,
  deposit: string,
  did: string,
  exp: string,
  modified: string
}

const columns: Column<Did>[] = [
  { header: 'DID', accessor: 'did' },
  { header: 'controller', accessor: 'controller' },
  { header: 'created', accessor: 'created' },
  { header: 'modified', accessor: 'modified' },
  { header: 'expire', accessor: 'exp' },
  { header: 'deposit', accessor: 'deposit' },
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
    <div>
      <div className="flex justify-end mb-6 p-6">
        <button
          onClick={() => router.push('/dids/add')}
          className="flex items-center text-blue-500 hover:underline"
        >
          <PlusIcon aria-hidden="true" className="h-6 w-6 mr-1" />
          <span>Add DID</span>
        </button>
      </div>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">DID Directory</h1>
        <DataTable
          columns={columns}
          data={dids}
          initialPageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          onRowClick={(row) => router.push(`/dids/${encodeURIComponent(row.did)}`)}
        />
      </div>
    </div>

  );
}