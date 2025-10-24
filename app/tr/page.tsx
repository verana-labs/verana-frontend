'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/ui/common/data-table';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/ui/common/notification-provider';
import { columnsTrList, TrList } from '@/ui/datatable/columnslist/tr';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

export default function TrPage() {
  const [trs, setTrs] = useState<TrList[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { notify } = useNotification();
  const listURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  useEffect(() => {
    const fetchTRs = async () => {
      try {
          if (!listURL){
            notify(
              resolveTranslatable({key: "error.endpoint"}, translate)?? 'API endpoint not configured',
              'error',
              resolveTranslatable({key: "error.fetch.tr.title"}, translate)?? 'Error fetching TR'
            );
          }
          const res = await fetch(listURL + `/list?controller=${address}&response_max_size=100`);
          const json = await res.json();
          const trustRegistries = Array.isArray(json) ? json : json.trust_registries || [];
          setTrs(trustRegistries);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          resolveTranslatable({key: "error.fetch.tr.title"}, translate)?? 'Error fetching TR'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTRs();
  }, [listURL, notify]);

  if (loading) return (
      <p>
        {resolveTranslatable({ key: "loading.trlist" }, translate) ?? "Loading TR List..."}
      </p>);

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({key: "trlist.title"}, translate)?? "Trust Registries"}
        buttonLabel={resolveTranslatable({key: "button.tr.add"}, translate)?? "Add Trust Registry"}
        to="/tr/add"
        Icon={PlusIcon}
      />
      <DataTable
        columnsI18n={columnsTrList}
        data={trs}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/tr/${encodeURIComponent(row.id)}`)}
        defaultSortColumn={'modified'}
      />
    </>
  );
}
