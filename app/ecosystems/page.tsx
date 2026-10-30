'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { CloudOffIcon, CompassIcon, LayersIcon, RotateCwIcon, SearchXIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ECOSYSTEMS_PAGE_SIZE } from '@/hooks/useEcosystems'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { EntityActionButton } from '@/ui/common/capability-button'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemsFilterBar, {
  EcosystemsFilterState,
  hasActiveEcosystemFilters,
  INITIAL_ECOSYSTEMS_FILTER,
} from '@/ui/common/ecosystems-filter-bar'
import { EmptyState } from '@/ui/common/empty-state'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { PageHeader } from '@/ui/common/page-header'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
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

function matchesSearch(ecosystem: EcosystemListItem, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return [
    ecosystem.did,
    ecosystem.corporationId,
    ecosystem.role,
    ecosystem.id,
    ecosystem.trustData?.serviceName,
    ecosystem.trustData?.organizationName,
  ].some((value) => value != null && String(value).toLowerCase().includes(q))
}

function readListError(ctx: object): string | null | undefined {
  if (!('errorEcosystems' in ctx)) return undefined
  const error = ctx.errorEcosystems
  return typeof error === 'string' && error ? error : null
}

function roleTokens(role: string | undefined | null): string[] {
  if (!role) return []
  return role
    .split(/[,\s]+/)
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean)
}

function isOwnedRole(role: string | undefined | null): boolean {
  return roleTokens(role).some((r) => r === 'ECOSYSTEM')
}

function hasParticipantRole(role: string | undefined | null): boolean {
  return roleTokens(role).some((r) => r !== 'ECOSYSTEM')
}

export default function EcosystemsPage() {
  const router = useRouter()
  const ecosystemsCtx = useEcosystemsCtx()
  const {
    ecosystemsList,
    ecosystemsLoading,
    refetch: refetchEcosystems,
    onlyActiveEcosystem,
    setOnlyActiveEcosystem,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
  } = ecosystemsCtx
  const listError = readListError(ecosystemsCtx)
  const { actingCorporation, loading: corporationLoading, error: discoveryError } = useUserCorporation()

  const [filters, setFilters] = useState<EcosystemsFilterState>({
    ...INITIAL_ECOSYSTEMS_FILTER,
    showArchived: !onlyActiveEcosystem,
  })
  const [view, setView] = useEcosystemsView()
  const [introPlayed, setIntroPlayed] = useState(false)

  const filtered = useMemo<EcosystemTableRow[]>(() => {
    const corporationId = actingCorporation?.corporation.id
    return ecosystemsList
      .map((ecosystem) => ({ ...ecosystem, owned: ecosystem.corporationId === corporationId }))
      .filter((ecosystem) => {
        if (!filters.showArchived && ecosystem.archived) return false
        if (filters.hideOwned && (ecosystem.owned || isOwnedRole(ecosystem.role))) return false
        if (filters.hideParticipant && hasParticipantRole(ecosystem.role)) return false
        if (!matchesSearch(ecosystem, filters.search)) return false
        if (!filters.showUntrusted && ecosystem.trustData?.trustStatus === 'UNTRUSTED') return false
        return true
      })
  }, [actingCorporation?.corporation.id, ecosystemsList, filters])

  const gridLoading = ecosystemsLoading && ecosystemsList.length === 0
  const filtersActive = hasActiveEcosystemFilters(filters)
  const hiddenUntrusted =
    !filters.showUntrusted && ecosystemsList.some((ecosystem) => ecosystem.trustData?.trustStatus === 'UNTRUSTED')

  useEffect(() => {
    if (!introPlayed && filtered.length > 0) setIntroPlayed(true)
  }, [filtered.length, introPlayed])

  const applyFilters = (nextFilters: EcosystemsFilterState) => {
    setFilters(nextFilters)
    setOnlyActiveEcosystem(!nextFilters.showArchived)
  }

  if (!actingCorporation && !corporationLoading) {
    if (discoveryError) return <div className="p-6 error-pane">{translate('corporation.page.error')}</div>
    return <p className="p-6 text-sm text-muted-foreground">{translate('corporation.page.nocorp')}</p>
  }

  const openCreate = () => router.push('/ecosystems/add')
  const showUntrustedAction = hiddenUntrusted ? (
    <Button variant="outline" size="sm" onClick={() => applyFilters({ ...filters, showUntrusted: true })}>
      {tr('datatable.ecosystem.filter.showUntrusted', 'Show untrusted ecosystems')}
    </Button>
  ) : null
  const clearFiltersAction = filtersActive ? (
    <Button variant="outline" size="sm" onClick={() => applyFilters({ ...INITIAL_ECOSYSTEMS_FILTER })}>
      {tr('ecosystems.filter.clear', 'Clear filters')}
    </Button>
  ) : null
  const showArchivedAction = filters.showArchived ? null : (
    <Button variant="ghost" size="sm" onClick={() => applyFilters({ ...filters, showArchived: true })}>
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
          description={
            hiddenUntrusted && !filtersActive
              ? tr('ecosystems.empty.untrustedHidden', 'Untrusted ecosystems are hidden by default.')
              : tr('ecosystems.empty.filtered.description', 'Try another search or clear the filters.')
          }
          action={
            <Actions>
              {clearFiltersAction}
              {showUntrustedAction}
            </Actions>
          }
        />
      )
    }
    if (listError === undefined) {
      return (
        <GhostEmpty
          className={GHOST_CLASS}
          icon={<LayersIcon />}
          title={tr('ecosystems.empty.unknown.title', 'No ecosystems to show')}
          description={tr(
            'ecosystems.empty.unknown.description',
            'Nothing came back for your corporation. Retry, or find an ecosystem to join in Discover.'
          )}
          action={
            <Actions>
              {retryAction}
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
        onChange={applyFilters}
        actions={<ViewToggle value={view} onChange={setView} />}
      />

      <section id="ecosystems-grid" aria-busy={gridLoading || undefined} className="mb-8">
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
                    <EcosystemCard ecosystem={ecosystem} enrichment={ecosystem.trustData} owned={ecosystem.owned} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {listError ? null : (
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
