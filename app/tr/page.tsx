'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/app/ui/common/data-table';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';
import { columnsTRList, TRList } from '@/app/types/dataTableTypes';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';

export default function TRPage() {
  const [trs, setTRs] = useState<TRList[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { notify } = useNotification();
  const listURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  useEffect(() => {
    const fetchTRs = async () => {
      try {
          if (!listURL) throw new Error('API endpoint not configured');
          const res = await fetch(listURL + `/list?controller=${address}&response_max_size=100`);
          const json = await res.json();
          const trustRegistries = Array.isArray(json) ? json : json.trust_registries || [];
          setTRs(trustRegistries);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          'Error fetching TRs'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTRs();
  }, [listURL, notify]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <TitleAndButton
        title="Trust Registries"
        buttonLabel="Add Trust Registry"
        to="/tr/add"
        Icon={PlusIcon}
      />
      <DataTable
        columns={columnsTRList}
        data={trs}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/tr/${encodeURIComponent(row.id)}`)}
        defaultSortColumn={'modified'}
      />
    </>
  );
}
