'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useMemo, useState } from 'react'
import AddEcosystemPage from '@/ecosystems/add/add'
import { ECOSYSTEMS_PAGE_SIZE } from '@/hooks/useEcosystems'
import { useCorporationRoles } from '@/hooks/useParticipants'
import { useFilterPersistence } from '@/hooks/usePersistedFilters'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { filterEcosystems, roleFiltersPending } from '@/lib/discover-list'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { EntityActionButton } from '@/ui/common/capability-button'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemCardSkeleton from '@/ui/common/ecosystem-card-skeleton'
import EcosystemsFilterBar, { INITIAL_ECOSYSTEMS_FILTER } from '@/ui/common/ecosystems-filter-bar'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { ModalAction } from '@/ui/common/modal-action'
import { resolveTranslatable } from '@/ui/dataview/types'

export default function EcosystemsPage() {
  const {
    ecosystemsList,
    ecosystemsLoading,
    ecosystemsError,
    refetch: refetchEcosystems,
    ecosystemFilters: filters,
    setEcosystemFilters,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
  } = useEcosystemsCtx()
  useFilterPersistence('ecosystems', filters, setEcosystemFilters, INITIAL_ECOSYSTEMS_FILTER)
  const { actingCorporation, loading: corporationLoading, error: discoveryError } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const { rolesByEcosystem, rolesLoading, failureReason } = useCorporationRoles(actingCorporationId)

  const [addEcosystem, setAddEcosystem] = useState(false)

  const shown = useMemo(
    () =>
      filterEcosystems(ecosystemsList, filters, {
        actingCorporationId,
        rolesByEcosystem,
        splitControlled: true,
      }),
    [actingCorporationId, filters, ecosystemsList, rolesByEcosystem]
  )

  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback
  const gridLoading = (ecosystemsLoading && ecosystemsList.length === 0) || roleFiltersPending(filters, rolesLoading)
  const errors = [
    ecosystemsError,
    failureReason ? translate('ecosystems.roles.failed', { reason: failureReason }) : null,
  ].filter((message): message is string => message !== null)
  // A failed list must not read as "no ecosystems match your filters".
  const noMatches = shown.length === 0 && ecosystemsError === null

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

      <EcosystemsFilterBar value={filters} onChange={setEcosystemFilters} />

      <section id="ecosystems-grid" className="mb-8">
        {errors.map((message) => (
          <div key={message} className="error-pane mb-4">
            {message}
          </div>
        ))}
        {gridLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(ECOSYSTEMS_PAGE_SIZE)].map((_, i) => (
              <EcosystemCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {noMatches ? (
              <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
                {t('datatable.ecosystem.empty', 'No ecosystems match your filters.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {shown.map((ecosystem) => (
                  <EcosystemCard
                    key={ecosystem.id}
                    ecosystem={ecosystem}
                    enrichment={ecosystem.trustData}
                    roles={rolesByEcosystem[ecosystem.id]}
                    controlled={ecosystem.corporationId === actingCorporationId}
                  />
                ))}
              </div>
            )}

            <KeysetPagination
              showing={shown.length}
              itemsLabel={t('datatable.ecosystem.pagination.ecosystems', 'ecosystems')}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPrevious={previousPage}
              onNext={nextPage}
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
