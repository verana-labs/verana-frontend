'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/ui/common/data-table';
import { useRouter } from 'next/navigation';
import TitleAndButton from '@/ui/common/title-and-button';
import { useNotification } from '@/ui/common/notification-provider';
import { columnsTrList, description, trFilter } from '@/ui/datatable/columnslist/tr';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { translateDataTableDescriptions } from '@/ui/datatable/types';
import { useTrustRegistries } from '@/hooks/useTrustRegistries';
import AddTrPage from '@/tr/add/add';
import { ModalAction } from '@/ui/common/modal-action';

export default function TrPage() {
  const router = useRouter();
  const [ showArchived, setShowArchived ] = useState(false);
  const [ trListAll, setTrListAll ] = useState(false);
  const { trList, errorTrList, refetch: fetchTrList } = useTrustRegistries(false, !showArchived);
  const [errorNotified, setErrorNotified] = useState(false);
  // Notification context for showing error messages
  const { notify } = useNotification();
  const [ addTR, setAddTR ] = useState<boolean>(false);
  
  useEffect(() => {
    if ( showArchived ) setTrListAll(true);
  }, [trList]);
  
  // Refresh trList
  const [refresh, setRefresh] = useState<boolean>(false);
  useEffect(() => {
    if (!refresh) return;
    console.info('useEffect TrPage');
    (async () => {
      await fetchTrList();
      setRefresh(false);
    })();
  }, [refresh]);

  // Refresh trList for showArchived change
  useEffect(() => {
    if ( showArchived && !trListAll ) setRefresh(true);
  }, [showArchived]);

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
  
  // if (loading) return (
  //     <p>
  //       {resolveTranslatable({ key: "loading.trlist" }, translate) ?? "Loading TR List..."}
  //     </p>);

  return (
    <>
      <TitleAndButton
        title=  {`${resolveTranslatable({key: "trlist.title"}, translate)?? "Trust Registry"}`}
        description={translateDataTableDescriptions(description)}
      />
      <DataTable
        tableTitle={resolveTranslatable({key: "datatable.tr.title"}, translate)}
        addTitle={resolveTranslatable({key: "datatable.tr.add"}, translate)}
        columnsI18n={columnsTrList}
        data={ trList.filter(item => showArchived || !item.archived)}
        initialPageSize={10}
        onRowClick={(row) => router.push(`/tr/${encodeURIComponent(row.id)}`)}
        defaultSortColumn={'modified'}
        filterI18n={trFilter}
        showDetailModal={false}
        detailTitle={resolveTranslatable({key: "datatable.tr.detail"}, translate)}
        onRefresh={() => setRefresh(true)}
        onAdd={() => setAddTR(true)}
        checkFilter={{
          show: showArchived,
          changeFilter: setShowArchived,
          label: resolveTranslatable({ key: "datatable.tr.filter.showArchived" }, translate)??'Show Archived',
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
          onRefresh={() => {
            setRefresh(true);
            setTimeout( () => setAddTR(false), 1000);
          }}
        />
      </ModalAction>
      )}

    </>
  );
}
