'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Building2Icon, CloudOffIcon, CompassIcon, LayersIcon, RotateCwIcon, SearchXIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ECOSYSTEMS_PAGE_SIZE } from '@/hooks/useEcosystems'
import { useCorporationRoles } from '@/hooks/useParticipants'
import { useFilterPersistence } from '@/hooks/usePersistedFilters'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { filterEcosystems, roleFiltersPending } from '@/lib/discover-list'
import { cn } from '@/lib/utils'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { EntityActionButton } from '@/ui/common/capability-button'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemsFilterBar, {
  hasActiveEcosystemFilters,
  INITIAL_ECOSYSTEMS_FILTER,
} from '@/ui/common/ecosystems-filter-bar'
import { EmptyState } from '@/ui/common/empty-state'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { PageHeader } from '@/ui/common/page-header'
import { EcosystemGridSkeleton } from '@/ui/ecosystems/ecosystem-grid-skeleton'
import { EcosystemsTable, type EcosystemTableRow } from '@/ui/ecosystems/ecosystems-table'
import { tr } from '@/ui/ecosystems/i18n'
import { useEcosystemsView, ViewToggle } from '@/ui/ecosystems/view-toggle'
import { BlurFade } from '@/ui/motion/blur-fade'
import { PageTransition } from '@/ui/motion/page-transition'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button, buttonVariants } from '@/ui/shadcn/button'

const GRID_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-5'

const GHOST_CLASS = 'min-h-80 overflow-hidden rounded-xl'

export default function EcosystemsPage() {
  const router = useRouter()
  const {
    ecosystemsList,
    ecosystemsLoading,
    ecosystemsError: listError,
    refetch: refetchEcosystems,
    ecosystemFilters: filters,
    setEcosystemFilters: setFilters,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
  } = useEcosystemsCtx()
  useFilterPersistence('ecosystems', filters, setFilters, INITIAL_ECOSYSTEMS_FILTER)
  const { actingCorporation, loading: corporationLoading, error: discoveryError } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const { rolesByEcosystem, rolesLoading, failureReason } = useCorporationRoles(actingCorporationId)

  const [view, setView] = useEcosystemsView()
  const [introPlayed, setIntroPlayed] = useState(false)

  const filtered = useMemo<EcosystemTableRow[]>(
    () =>
      filterEcosystems(ecosystemsList, filters, {
        actingCorporationId,
        rolesByEcosystem,
        splitControlled: true,
        trustFilter: false,
      }).map((ecosystem) => ({
        ...ecosystem,
        owned: ecosystem.corporationId === actingCorporationId,
        roles: rolesByEcosystem[ecosystem.id] ?? [],
      })),
    [actingCorporationId, ecosystemsList, filters, rolesByEcosystem]
  )

  const gridLoading = (ecosystemsLoading && ecosystemsList.length === 0) || roleFiltersPending(filters, rolesLoading)
  const filtersActive = hasActiveEcosystemFilters(filters, { trustFilter: false })
  const errors = [
    listError,
    failureReason ? translate('ecosystems.roles.failed', { reason: failureReason }) : null,
  ].filter((message): message is string => message !== null)

  useEffect(() => {
    if (!introPlayed && filtered.length > 0) setIntroPlayed(true)
  }, [filtered.length, introPlayed])

  if (!actingCorporation && !corporationLoading) {
    return (
      <PageTransition>
        <EmptyState
          className="bg-card/50 py-16"
          icon={discoveryError ? <CloudOffIcon /> : <Building2Icon />}
          title={translate(discoveryError ? 'corporation.page.error' : 'corporation.page.nocorp')}
        />
      </PageTransition>
    )
  }

  const openCreate = () => router.push('/ecosystems/add')
  const clearFiltersAction = filtersActive ? (
    <Button variant="outline" size="sm" onClick={() => setFilters({ ...INITIAL_ECOSYSTEMS_FILTER })}>
      {tr('ecosystems.filter.clear', 'Clear filters')}
    </Button>
  ) : null
  const showArchivedAction = filters.showArchived ? null : (
    <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, showArchived: true })}>
      {tr('datatable.ecosystem.filter.showArchived', 'Show archived')}
    </Button>
  )
  const retryAction = (
    <Button variant="outline" size="sm" onClick={() => void refetchEcosystems()}>
      <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
      {tr('ecosystems.retry', 'Retry')}
    </Button>
  )
  const discoverAction = (
    <Link href="/discover" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
      <CompassIcon data-icon="inline-start" aria-hidden="true" />
      {tr('ecosystems.empty.none.discover', 'Browse Discover')}
    </Link>
  )

  function renderEmpty(): ReactNode {
    if (listError) {
      return (
        <EmptyState
          className="border-dashed bg-card/50"
          icon={<CloudOffIcon />}
          title={tr('ecosystems.error.title', 'Could not load ecosystems')}
          description={tr('ecosystems.error.description', 'The indexer did not answer. Check the network and retry.')}
          action={retryAction}
        />
      )
    }
    if (ecosystemsList.length > 0 || filtersActive) {
      return (
        <EmptyState
          className="border-dashed bg-card/50"
          icon={<SearchXIcon />}
          title={tr('datatable.ecosystem.empty', 'No ecosystems match your filters.')}
          description={tr('ecosystems.empty.filtered.description', 'Try another search or clear the filters.')}
          action={<Actions>{clearFiltersAction}</Actions>}
        />
      )
    }
    return (
      <GhostEmpty
        className={GHOST_CLASS}
        icon={<LayersIcon />}
        title={tr('ecosystems.empty.none.title', 'No ecosystems yet')}
        description={tr(
          'ecosystems.empty.none.description',
          'Create an ecosystem for your corporation, or find one to join in Discover.'
        )}
        action={
          <Actions>
            {discoverAction}
            {showArchivedAction}
          </Actions>
        }
      >
        <EcosystemGridSkeleton ghost count={3} className={cn(GRID_CLASS, 'w-full')} />
      </GhostEmpty>
    )
  }

  return (
    <PageTransition>
      <BlurFade>
        <PageHeader
          title={tr('ecosystemList.title', 'Ecosystems')}
          description={tr('datatable.ecosystem.description', 'Ecosystems owned by your corporation.')}
          actions={
            <EntityActionButton
              msgType="MsgCreateEcosystem"
              icon={faPlus}
              label={tr('datatable.ecosystem.add', 'Create Ecosystem')}
              onClick={openCreate}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-9 gap-2 px-3.5 shadow-xs [&_svg]:size-3.5 [&>svg:last-child]:text-primary-foreground/80'
              )}
            />
          }
        />
      </BlurFade>

      <EcosystemsFilterBar
        value={filters}
        onChange={setFilters}
        trustFilter={false}
        actions={<ViewToggle value={view} onChange={setView} />}
      />

      <section id="ecosystems-grid" aria-busy={gridLoading || undefined} className="mb-8">
        {errors.map((message) => (
          <div key={message} className="error-pane mb-4">
            {message}
          </div>
        ))}
        {gridLoading ? (
          view === 'list' ? (
            <EcosystemsTable rows={[]} loading />
          ) : (
            <EcosystemGridSkeleton count={ECOSYSTEMS_PAGE_SIZE} className={GRID_CLASS} />
          )
        ) : (
          <>
            {filtered.length === 0 ? (
              renderEmpty()
            ) : view === 'list' ? (
              <EcosystemsTable rows={filtered} />
            ) : (
              <Stagger className={GRID_CLASS} initial={introPlayed ? false : 'hidden'}>
                {filtered.map((ecosystem) => (
                  <StaggerItem key={ecosystem.id} className="h-full">
                    <EcosystemCard
                      ecosystem={ecosystem}
                      enrichment={ecosystem.trustData}
                      roles={ecosystem.roles}
                      controlled={ecosystem.owned}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {listError || (filtered.length === 0 && !hasPrevious && !hasNext) ? null : (
              <KeysetPagination
                showing={filtered.length}
                itemsLabel={tr('datatable.ecosystem.pagination.ecosystems', 'ecosystems')}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                onPrevious={previousPage}
                onNext={nextPage}
              />
            )}
          </>
        )}
      </section>
    </PageTransition>
  )
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>
}
