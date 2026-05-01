'use client';

import { useEffect, useMemo, useState } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { useEcosytemsCtx } from '@/providers/api-rest-query-provider-context';
import { TrList } from '@/ui/datatable/columnslist/tr';

import EcosystemCard from '@/ui/common/ecosystem-card';
import EcosystemsFilterBar, {
  EcosystemsFilterState,
  INITIAL_ECOSYSTEMS_FILTER,
} from '@/ui/common/ecosystems-filter-bar';
import EcosystemsPagination from '@/ui/common/ecosystems-pagination';
import { ModalAction } from '@/ui/common/modal-action';
import AddTrPage from '@/tr/add/add';

const PAGE_SIZE = 9;

function matchesSearch(tr: TrList, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [tr.did, tr.aka, tr.controller, tr.role, tr.id].some((v) =>
    v != null && String(v).toLowerCase().includes(q),
  );
}

function isOwnedRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return role
    .split(/[,\s]+/)
    .map((r) => r.trim().toUpperCase())
    .some((r) => r === 'ECOSYSTEM');
}

function hasParticipantRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return role
    .split(/[,\s]+/)
    .map((r) => r.trim().toUpperCase())
    .some((r) => r && r !== 'ECOSYSTEM');
}

export default function TrPage() {
  const ecosystemsCtx = useEcosytemsCtx();

  const [filters, setFilters] = useState<EcosystemsFilterState>({
    ...INITIAL_ECOSYSTEMS_FILTER,
    showArchived: !ecosystemsCtx.onlyActiveEcosystem,
  });
  const [page, setPage] = useState<number>(1);
  const [addTR, setAddTR] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(true);
  const [trListAll, setTrListAll] = useState<boolean>(false);


  useEffect(() => {
    if (!refresh) return;
    void (async () => {
      await ecosystemsCtx.refetch();
      setRefresh(false);
    })();
  }, [refresh, ecosystemsCtx]);

  useEffect(() => {
    ecosystemsCtx.setOnlyActiveEcosystem(!filters.showArchived);
    if (filters.showArchived && !trListAll) setRefresh(true);
  }, [filters.showArchived, trListAll, ecosystemsCtx]);

  useEffect(() => {
    if (filters.showArchived) setTrListAll(true);
  }, [ecosystemsCtx.ecosystemsList, filters.showArchived]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filtered = useMemo(() => {
    return ecosystemsCtx.ecosystemsList.filter((tr) => {
      if (!filters.showArchived && tr.archived) return false;
      if (filters.hideOwned && isOwnedRole(tr.role)) return false;
      if (filters.hideParticipant && hasParticipantRole(tr.role)) return false;
      if (!matchesSearch(tr, filters.search)) return false;
      return true;
    });
  }, [ecosystemsCtx.ecosystemsList, filters]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const t = (key: string, fallback: string) =>
    resolveTranslatable({ key }, translate) ?? fallback;

  return (
    <>
      <section id="page-header" className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">
              {t('trlist.title', 'Ecosystems')}
            </h1>
            <p className="page-description">
              {t(
                'datatable.tr.description',
                'Ecosystems you own and ecosystems you joined.',
              )}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => setAddTR(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('datatable.tr.add', 'Create Ecosystem')}
            </button>
          </div>
        </div>
      </section>

      <EcosystemsFilterBar value={filters} onChange={setFilters} />

      <section id="ecosystems-grid" className="mb-8">
        {pageItems.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
            {t('datatable.tr.empty', 'No ecosystems match your filters.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {pageItems.map((tr) => (
              <EcosystemCard
                key={tr.id}
                ecosystem={tr}
                hideUntrusted={!filters.showUntrusted}
              />
            ))}
          </div>
        )}

        <EcosystemsPagination
          page={safePage}
          pageCount={pageCount}
          showing={pageItems.length}
          total={total}
          onChange={setPage}
        />
      </section>

      {addTR && (
        <ModalAction
          onClose={() => setAddTR(false)}
          titleKey={'datatable.tr.add.modal.title'}
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
