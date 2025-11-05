'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/ui/common/data-table';
import { useRouter } from 'next/navigation';
import TitleAndButton from '@/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/ui/common/notification-provider';
import { columnsDidList, description, didFilter, DidList } from '@/ui/datatable/columnslist/did';
import { useChain } from '@cosmos-kit/react';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { translateDataTableDescriptions } from '@/ui/datatable/types';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { getStatus } from '@/util/util';

export default function DidPage() {
  const [dids, setDids] = useState<DidList[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { notify } = useNotification();
  const listUrl = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID;
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  useEffect(() => {
    const fetchDIDs = async () => {
      try {
          if (!listUrl){
            notify(
              resolveTranslatable({key: "error.endpoint"}, translate)?? 'API endpoint not configured',
              'error',
              resolveTranslatable({key: "error.fetch.did.title"}, translate)?? 'Error fetching DID'
            );
          }
          const res = await fetch(listUrl + `/list?account=${address}`);
          const json = await res.json();
          let listDids = Array.isArray(json) ? json : json.dids || [];
          listDids = listDids.map((did: any) => ({
            ...did,
            status: getStatus(did.exp)
          }));
          setDids(listDids);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          resolveTranslatable({key: "error.fetch.did.title"}, translate)?? 'Error fetching DID'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDIDs();
  }, [listUrl, address]);

  if (loading) return (
      <p>
        {resolveTranslatable({ key: "loading.directory" }, translate) ?? "Loading DID Directory..."}
      </p>);

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({key: "directory.title"}, translate)?? "DID Directory"}
        description={translateDataTableDescriptions(description)}
        buttonLabel={resolveTranslatable({key: "button.did.add"}, translate)?? "Add DID"}
        to="/did/add"
        Icon={faPlus}
      />
      <DataTable
        entities={resolveTranslatable({key: "datatable.did.entities"}, translate)??''}
        columnsI18n={columnsDidList}
        data={dids}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        onRowClick={(row) => router.push(`/did/${encodeURIComponent(row.did)}`)}
        defaultSortColumn={'modified'}
        filterI18n={didFilter}
        showDetailModal={true}
      />
    </>
  );
}