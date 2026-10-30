'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useMemo, useState } from 'react'
import AddEcosystemPage from '@/ecosystems/add/add'
import { ECOSYSTEMS_PAGE_SIZE } from '@/hooks/useEcosystems'
import { useCorporationRolesByEcosystem } from '@/hooks/useParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { clientPage, filterEcosystems, roleFiltersPending } from '@/lib/discover-list'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { EntityActionButton } from '@/ui/common/capability-button'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemCardSkeleton from '@/ui/common/ecosystem-card-skeleton'
import EcosystemsFilterBar from '@/ui/common/ecosystems-filter-bar'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { ModalAction } from '@/ui/common/modal-action'
import { resolveTranslatable } from '@/ui/dataview/types'

export default function EcosystemsPage() {
  const {
    ecosystemsList,
    ecosystemsLoading,
    refetch: refetchEcosystems,
    ecosystemFilters: filters,
    setEcosystemFilters,
    ecosystemsSearch,
    ecosystemsFullWindow,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
  } = useEcosystemsCtx()
  const { actingCorporation, loading: corporationLoading, error: discoveryError } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const { rolesByEcosystem, rolesLoading } = useCorporationRolesByEcosystem(actingCorporationId)

  const [addEcosystem, setAddEcosystem] = useState(false)

  const appliedFilters = useMemo(() => ({ ...filters, search: ecosystemsSearch }), [filters, ecosystemsSearch])
  const pagingKey = JSON.stringify([appliedFilters, actingCorporationId])
  const [paging, setPaging] = useState({ key: pagingKey, index: 0 })
  const pageIndex = paging.key === pagingKey ? paging.index : 0

  const filtered = useMemo(
    () => filterEcosystems(ecosystemsList, appliedFilters, { actingCorporationId, rolesByEcosystem }),
    [actingCorporationId, appliedFilters, ecosystemsList, rolesByEcosystem]
  )
  const page = useMemo(
    () =>
      ecosystemsFullWindow
        ? clientPage(filtered, pageIndex, ECOSYSTEMS_PAGE_SIZE)
        : { items: filtered, page: 0, hasPrevious, hasNext },
    [ecosystemsFullWindow, filtered, hasNext, hasPrevious, pageIndex]
  )
  const shown = page.items

  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback
  const gridLoading = (ecosystemsLoading && ecosystemsList.length === 0) || roleFiltersPending(filters, rolesLoading)
  const partial = hasNext || hasPrevious

  if (!actingCorporation && !corporationLoading) {
    if (discoveryError) return <div className="p-6 error-pane">{translate('corporation.page.error')}</div>
    return <p className="p-6 text-sm text-gray-600 dark:text-gray-300">{translate('corporation.page.nocorp')}</p>
  }

  return (
    <>
      <section id="page-header" className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">{t('ecosystemList.title', 'Ecosystems')}</h1>
            <p className="page-description">
              {t('datatable.ecosystem.description', 'Ecosystems owned by your corporation.')}
            </p>
          </div>
          <div className="shrink-0">
            <EntityActionButton
              msgType="MsgCreateEcosystem"
              icon={faPlus}
              label={t('datatable.ecosystem.add', 'Create Ecosystem')}
              onClick={() => setAddEcosystem(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            />
          </div>
        </div>
      </section>

      <EcosystemsFilterBar value={filters} onChange={setEcosystemFilters}>
        {partial ? (
          <p className="text-xs text-neutral-70 dark:text-neutral-70">
            {t('pagination.loadedOnly', 'Sorting and filters apply to the loaded results only.')}
          </p>
        ) : null}
      </EcosystemsFilterBar>

      <section id="ecosystems-grid" className="mb-8">
        {gridLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(ECOSYSTEMS_PAGE_SIZE)].map((_, i) => (
              <EcosystemCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {shown.length === 0 ? (
              <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
                {t('datatable.ecosystem.empty', 'No ecosystems match your filters.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {shown.map((ecosystem) => (
                  <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} enrichment={ecosystem.trustData} />
                ))}
              </div>
            )}

            <KeysetPagination
              showing={shown.length}
              itemsLabel={t('datatable.ecosystem.pagination.ecosystems', 'ecosystems')}
              hasPrevious={page.hasPrevious}
              hasNext={page.hasNext}
              loadedOnlyNote={false}
              onPrevious={() => {
                if (ecosystemsFullWindow) setPaging({ key: pagingKey, index: page.page - 1 })
                else previousPage()
              }}
              onNext={() => {
                if (ecosystemsFullWindow) setPaging({ key: pagingKey, index: page.page + 1 })
                else nextPage()
              }}
            />
          </>
        )}
      </section>

      {addEcosystem && (
        <ModalAction
          onClose={() => setAddEcosystem(false)}
          titleKey="datatable.ecosystem.add.modal.title"
          isActive={addEcosystem}
        >
          <AddEcosystemPage
            onCancel={() => setAddEcosystem(false)}
            onRefresh={() => {
              void refetchEcosystems()
              setAddEcosystem(false)
            }}
          />
        </ModalAction>
      )}
    </>
  )
}
