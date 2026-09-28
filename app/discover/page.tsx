'use client'

import { useMemo } from 'react'
import type { EcosystemSchemaPage } from '@/hooks/useCredentialSchemas'
import { useCorporationRolesByEcosystem } from '@/hooks/useParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { filterEcosystems, orderEcosystems } from '@/lib/discover-list'
import { useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import { DiscoverEcosystemCard } from '@/ui/common/discover-ecosystem-card'
import EcosystemsFilterBar from '@/ui/common/ecosystems-filter-bar'
import KeysetPagination from '@/ui/common/keyset-pagination'
import TitleAndButton from '@/ui/common/title-and-button'
import { resolveTranslatable } from '@/ui/dataview/types'

const NO_SCHEMAS: EcosystemSchemaPage = { items: [], hasNext: false }

function scrollToTop(): void {
  document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
}

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export default function DiscoverJoinPage() {
  const discoverCtx = useDiscoverCtx()
  const { discoverList, discoverFilters: filters, setDiscoverFilters } = discoverCtx
  const { actingCorporation } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const ecosystemIds = useMemo(() => discoverList.map((ecosystem) => ecosystem.id), [discoverList])
  const { rolesByEcosystem, errorRoles } = useCorporationRolesByEcosystem(actingCorporationId, ecosystemIds)

  const shown = useMemo(
    () =>
      orderEcosystems(
        filterEcosystems(discoverList, filters, { actingCorporationId, rolesByEcosystem }),
        filters.order
      ),
    [actingCorporationId, discoverList, filters, rolesByEcosystem]
  )

  const partial = discoverCtx.hasNext || discoverCtx.hasPrevious
  const loading = discoverCtx.loading && discoverList.length === 0
  const error = discoverCtx.error ?? errorRoles

  return (
    <>
      <TitleAndButton title={t('discover.title')} />

      <EcosystemsFilterBar
        value={filters}
        onChange={(next) => setDiscoverFilters({ ...filters, ...next })}
        corporationFilters={actingCorporationId !== undefined}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label htmlFor="discover-order" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('discover.order.label')}
          </label>
          <select
            id="discover-order"
            value={filters.order}
            onChange={(e) =>
              setDiscoverFilters({ ...filters, order: e.target.value === 'trustValue' ? 'trustValue' : 'newest' })
            }
            className="px-3 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">{t('discover.order.newest')}</option>
            <option value="trustValue">{t('discover.order.trustValue')}</option>
          </select>
        </div>
        {partial ? <p className="text-xs text-neutral-70 dark:text-neutral-70">{t('pagination.loadedOnly')}</p> : null}
      </EcosystemsFilterBar>

      {error ? <div className="error-pane mb-6">{error}</div> : null}

      <section id="ecosystem-list" className="space-y-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card rounded-xl border border-neutral-20 dark:border-neutral-70">
              <div className="skeleton-title mb-2 w-1/2" />
              <div className="skeleton-text w-1/3 mb-6" />
              <div className="space-y-4">
                <div className="skeleton-block h-16 rounded-lg" />
                <div className="skeleton-block h-16 rounded-lg" />
              </div>
            </div>
          ))
        ) : shown.length === 0 ? (
          <div className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-70 dark:text-neutral-70">{t('discover.empty')}</p>
          </div>
        ) : (
          shown.map((ecosystem) => (
            <DiscoverEcosystemCard
              key={ecosystem.id}
              ecosystem={ecosystem}
              credentialSchemas={discoverCtx.credentialSchemasByEcosystem[ecosystem.id] ?? NO_SCHEMAS}
              schemasError={discoverCtx.errorCredentialSchemas}
              onLoadMoreSchemas={() => discoverCtx.loadMoreCredentialSchemas(ecosystem.id)}
              roles={rolesByEcosystem[ecosystem.id] ?? []}
              canJoin={actingCorporationId !== undefined}
            />
          ))
        )}
      </section>

      <KeysetPagination
        showing={shown.length}
        itemsLabel={t('datatable.ecosystem.pagination.ecosystems')}
        hasPrevious={discoverCtx.hasPrevious}
        hasNext={discoverCtx.hasNext}
        onPrevious={() => {
          discoverCtx.previousPage()
          scrollToTop()
        }}
        onNext={() => {
          discoverCtx.nextPage()
          scrollToTop()
        }}
      />
    </>
  )
}
