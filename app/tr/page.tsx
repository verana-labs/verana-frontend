'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/ui/common/data-table';
import { useRouter } from 'next/navigation';
import TitleAndButton from '@/ui/common/title-and-button';
import { columnsTrList, description, trFilter } from '@/ui/datatable/columnslist/tr';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { translateDataTableDescriptions } from '@/ui/datatable/types';
import AddTrPage from '@/tr/add/add';
import { ModalAction } from '@/ui/common/modal-action';
import { useEcosytemsCtx } from '@/providers/api-rest-query-provider-context';

export default function TrPage() {
  const router = useRouter();
  const ecosystemsCtx = useEcosytemsCtx();
  const [ showArchived, setShowArchived ] = useState(!ecosystemsCtx.onlyActiveEcosystem);
  const [ trListAll, setTrListAll ] = useState(false);
    
  const [ addTR, setAddTR ] = useState<boolean>(false);
  
  useEffect(() => {
    if ( showArchived ) setTrListAll(true);
  }, [ecosystemsCtx.ecosystemsList]);
  
  // Refresh trList
  const [refresh, setRefresh] = useState<boolean>(true);
  useEffect(() => {
    if (!refresh) return;
    (async () => {
      await ecosystemsCtx.refetch();
      setRefresh(false);
    })();
  }, [refresh]);

  // Refresh trList for showArchived change
  useEffect(() => {
    ecosystemsCtx.setOnlyActiveEcosystem(!showArchived);
    if ( showArchived && !trListAll ) setRefresh(true);
  }, [showArchived]);
  
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
        data={ ecosystemsCtx.ecosystemsList.filter(item => showArchived || !item.archived)}
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
        currentFilters={{
          filters: ecosystemsCtx.ecosystemFilters,
          setFilters: ecosystemsCtx.setEcosystemFilters,
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
            setAddTR(false);
          }}
        />
      </ModalAction>
      )}

    </>
  );
}
