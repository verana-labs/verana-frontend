'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/ui/common/data-table';
import { useRouter } from 'next/navigation';
import TitleAndButton from '@/ui/common/title-and-button';
import { useNotification } from '@/ui/common/notification-provider';
import { columnsTrList, description, trFilter, TrList } from '@/ui/datatable/columnslist/tr';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { translateDataTableDescriptions } from '@/ui/datatable/types';
import { useTrustRegistries } from '@/hooks/useTrustRegistries';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import AddTrPage from '@/tr/add/add';
import { ModalAction } from '@/ui/common/modal-action';

export default function TrPage() {
  const [trs, setTrs] = useState<TrList[]>([]);
  const router = useRouter();
  const { trList, loading, errorTrList, refetch: fetchTrList } = useTrustRegistries();
  const [errorNotified, setErrorNotified] = useState(false);
  // Notification context for showing error messages
  const { notify } = useNotification();
  const [ addTR, setAddTR ] = useState<boolean>(false);
  
  useEffect(() => {
    setTrs(trList);
  }, [trList]);
  
  // Refresh trList
  const [refresh, setRefresh] = useState<boolean>(false);
  useEffect(() => {
    if (!refresh) return;
    (async () => {
      await fetchTrList();
      setRefresh(false);
    })();
  }, [refresh]);

  // Notify and redirect if there is an error fetching account data
  useEffect(() => {
    // Show a notification if an error occurred
    if (errorTrList && !errorNotified) {
      (async () => {
        await notify(errorTrList, 'error', resolveTranslatable({key: "error.fetch.tr.title"}, translate));
        setErrorNotified(true);
        router.push('/');
      })();
    }
  }, [errorTrList, router, errorNotified]);
  
  if (loading) return (
      <p>
        {resolveTranslatable({ key: "loading.trlist" }, translate) ?? "Loading TR List..."}
      </p>);

  return (
    <>
      <TitleAndButton
        title=  {`${resolveTranslatable({key: "trlist.title"}, translate)?? "Trust Registry"}`}
        description={translateDataTableDescriptions(description)}
        buttonLabel={resolveTranslatable({key: "button.tr.add"}, translate)}
        icon={faPlus}
        onClick={() => setAddTR(true)}
      />
      <DataTable
        entities={resolveTranslatable({key: "datatable.tr.entities"}, translate)??''}
        columnsI18n={columnsTrList}
        data={trs}
        initialPageSize={10}
        onRowClick={(row) => router.push(`/tr/${encodeURIComponent(row.id)}`)}
        defaultSortColumn={'modified'}
        filterI18n={trFilter}
        showDetailModal={false}
        detailTitle={resolveTranslatable({key: "datatable.tr.detail"}, translate)}
        onRefresh={() => {
          console.info("onRefreshPage");
          setRefresh(true);
        }}
      />
      {/* render modal add Trust Registry*/}
      {addTR && (
      <ModalAction
        onClose={() => setAddTR(false)}
        titleKey={"datatable.tr.add" }
        isActive={addTR}
      >
        <AddTrPage
          onCancel={() => setAddTR(false)}
          onRefresh={() => setRefresh(true)}
        />
      </ModalAction>
      )}

    </>
  );
}
