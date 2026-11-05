'use client'

import { CompassIcon, RotateCwIcon, SearchXIcon, ServerCrashIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { EcosystemSchemaPage } from '@/hooks/useCredentialSchemas'
import { useCorporationRoles } from '@/hooks/useParticipants'
import { useFilterPersistence } from '@/hooks/usePersistedFilters'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import {
  clientPage,
  filterEcosystems,
  INITIAL_DISCOVER_FILTERS,
  orderEcosystems,
  roleFiltersPending,
} from '@/lib/discover-list'
import { DISCOVER_PAGE_SIZE, useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import { DiscoverEcosystemCard } from '@/ui/common/discover-ecosystem-card'
import { EmptyState } from '@/ui/common/empty-state'
import KeysetPagination from '@/ui/common/keyset-pagination'
import TitleAndButton from '@/ui/common/title-and-button'
import { DiscoverCardSkeleton } from '@/ui/discover/discover-card-skeleton'
import { DiscoverFilters } from '@/ui/discover/discover-filters'
import { DiscoverStats } from '@/ui/discover/discover-stats'
import { discoverText as t } from '@/ui/discover/text'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'

const NO_SCHEMAS: EcosystemSchemaPage = { items: [], hasNext: false }
const NO_ECOSYSTEM_IDS: string[] = []

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function DiscoverJoinPage() {
  const discoverCtx = useDiscoverCtx()
  const {
    discoverList,
    discoverFilters: filters,
    setDiscoverFilters,
    discoverSearch,
    fullWindow,
    setShownEcosystemIds,
  } = discoverCtx
  useFilterPersistence('discover', filters, setDiscoverFilters, INITIAL_DISCOVER_FILTERS)
  const { actingCorporation } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const { rolesByEcosystem, rolesLoading, failureReason } = useCorporationRoles(actingCorporationId)

  const appliedFilters = useMemo(() => ({ ...filters, search: discoverSearch }), [filters, discoverSearch])
  const pagingKey = JSON.stringify([appliedFilters, actingCorporationId])
  const [paging, setPaging] = useState({ key: pagingKey, index: 0 })
  const pageIndex = paging.key === pagingKey ? paging.index : 0

  const matching = useMemo(
    () =>
      orderEcosystems(
        filterEcosystems(discoverList, appliedFilters, { actingCorporationId, rolesByEcosystem }),
        appliedFilters.order
      ),
    [actingCorporationId, appliedFilters, discoverList, rolesByEcosystem]
  )
  const page = useMemo(
    () =>
      fullWindow
        ? clientPage(matching, pageIndex, DISCOVER_PAGE_SIZE)
        : { items: matching, page: 0, hasPrevious: discoverCtx.hasPrevious, hasNext: discoverCtx.hasNext },
    [discoverCtx.hasNext, discoverCtx.hasPrevious, fullWindow, matching, pageIndex]
  )
  const shown = page.items

  useEffect(() => {
    setShownEcosystemIds(fullWindow ? shown.map((ecosystem) => ecosystem.id) : NO_ECOSYSTEM_IDS)
  }, [fullWindow, setShownEcosystemIds, shown])

  const partial = discoverCtx.hasNext || discoverCtx.hasPrevious
  const loading = (discoverCtx.loading && discoverList.length === 0) || roleFiltersPending(filters, rolesLoading)
  const listError = discoverCtx.error
  const listFailed = Boolean(listError) && !loading && discoverList.length === 0
  const rolesError = failureReason ? t('discover.roles.failed', { reason: failureReason }) : null
  const showPagination = !loading && !listFailed && (shown.length > 0 || page.hasPrevious || page.hasNext)

  return (
    <>
      <TitleAndButton title={t('discover.title')} description={[t('discover.description')]} />

      <DiscoverStats
        ecosystems={matching}
        loading={loading}
        unavailable={listFailed}
        scope={partial ? (fullWindow ? 'loaded' : 'page') : 'matching'}
      />

      <DiscoverFilters
        value={filters}
        onChange={setDiscoverFilters}
        corporationFilters={actingCorporationId !== undefined}
        loadedOnly={partial}
      />

      {rolesError ? <div className="error-pane mb-6">{rolesError}</div> : null}
      {listError && !listFailed ? <div className="error-pane mb-6">{listError}</div> : null}

      <section id="ecosystem-list" aria-busy={loading} className="flex flex-col gap-4 sm:gap-5">
        {loading ? (
          [0, 1, 2].map((slot) => <DiscoverCardSkeleton key={slot} />)
        ) : listFailed ? (
          <EmptyState
            className="rounded-xl bg-card py-12"
            icon={<ServerCrashIcon />}
            title={t('discover.error.title')}
            description={
              <>
                {t('discover.error.hint')}
                <span className="mt-2 block font-mono text-xs text-muted-foreground/80">{listError}</span>
              </>
            }
            action={
              <Button variant="outline" onClick={() => void discoverCtx.refetch()}>
                <RotateCwIcon aria-hidden="true" />
                {t('discover.retry')}
              </Button>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState
            className="rounded-xl bg-card py-12"
            icon={filters.search ? <SearchXIcon /> : <CompassIcon />}
            title={t('discover.empty')}
            description={t('discover.empty.hint')}
            action={
              filters.search ? (
                <Button variant="outline" onClick={() => setDiscoverFilters({ ...filters, search: '' })}>
                  {t('discover.search.clear')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stagger className="flex flex-col gap-4 sm:gap-5">
            {shown.map((ecosystem) => (
              <StaggerItem key={ecosystem.id}>
                <DiscoverEcosystemCard
                  ecosystem={ecosystem}
                  credentialSchemas={discoverCtx.credentialSchemasByEcosystem[ecosystem.id] ?? NO_SCHEMAS}
                  schemasError={discoverCtx.errorCredentialSchemas}
                  moreSchemasFailed={Boolean(discoverCtx.moreSchemaErrors[ecosystem.id])}
                  onLoadMoreSchemas={() => discoverCtx.loadMoreCredentialSchemas(ecosystem.id)}
                  roles={rolesByEcosystem[ecosystem.id] ?? []}
                  canJoin={actingCorporationId !== undefined}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      {showPagination ? (
        <KeysetPagination
          showing={shown.length}
          itemsLabel={t('datatable.ecosystem.pagination.ecosystems')}
          hasPrevious={page.hasPrevious}
          hasNext={page.hasNext}
          loadedOnlyNote={false}
          onPrevious={() => {
            if (fullWindow) setPaging({ key: pagingKey, index: page.page - 1 })
            else discoverCtx.previousPage()
            scrollToTop()
          }}
          onNext={() => {
            if (fullWindow) setPaging({ key: pagingKey, index: page.page + 1 })
            else discoverCtx.nextPage()
            scrollToTop()
          }}
        />
      ) : null}
    </>
  )
}
