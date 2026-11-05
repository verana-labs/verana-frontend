'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Building2Icon, CloudOffIcon, SearchXIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AddEcosystemPage from '@/ecosystems/add/add'
import { ECOSYSTEMS_PAGE_SIZE } from '@/hooks/useEcosystems'
import { useCorporationRoles } from '@/hooks/useParticipants'
import { usePersistedFilters } from '@/hooks/usePersistedFilters'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { roleFiltersPending } from '@/lib/discover-list'
import { cn } from '@/lib/utils'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { EntityActionButton } from '@/ui/common/capability-button'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemsFilterBar, { INITIAL_ECOSYSTEMS_FILTER } from '@/ui/common/ecosystems-filter-bar'
import { EmptyState } from '@/ui/common/empty-state'
import KeysetPagination from '@/ui/common/keyset-pagination'
import { ModalAction } from '@/ui/common/modal-action'
import { PageHeader } from '@/ui/common/page-header'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { EcosystemGridSkeleton } from '@/ui/ecosystems/ecosystem-grid-skeleton'
import { tr } from '@/ui/ecosystems/i18n'
import { BlurFade } from '@/ui/motion/blur-fade'
import { PageTransition } from '@/ui/motion/page-transition'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { buttonVariants } from '@/ui/shadcn/button'

const GRID_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-5'

function matchesSearch(ecosystem: EcosystemListItem, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return [
    ecosystem.did,
    ecosystem.corporationId,
    ecosystem.id,
    ecosystem.trustData?.serviceName,
    ecosystem.trustData?.organizationName,
  ].some((value) => value != null && String(value).toLowerCase().includes(q))
}

export default function EcosystemsPage() {
  const {
    ecosystemsList,
    ecosystemsLoading,
    refetch: refetchEcosystems,
    setOnlyActiveEcosystem,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
  } = useEcosystemsCtx()
  const { actingCorporation, loading: corporationLoading, error: discoveryError } = useUserCorporation()
  const actingCorporationId = actingCorporation?.corporation.id
  const { rolesByEcosystem, rolesLoading, failureReason } = useCorporationRoles(actingCorporationId)

  const [filters, setFilters] = usePersistedFilters('ecosystems', INITIAL_ECOSYSTEMS_FILTER)
  useEffect(() => {
    setOnlyActiveEcosystem(!filters.showArchived)
  }, [filters.showArchived, setOnlyActiveEcosystem])
  const [addEcosystem, setAddEcosystem] = useState(false)
  const [introPlayed, setIntroPlayed] = useState(false)

  const filtered = useMemo(() => {
    return ecosystemsList.filter((ecosystem) => {
      if (!filters.showArchived && ecosystem.archived) return false
      const roles = rolesByEcosystem[ecosystem.id] ?? []
      const isOwned = ecosystem.corporationId === actingCorporationId || roles.includes('ECOSYSTEM')
      if (filters.hideOwned && isOwned) return false
      if (filters.hideParticipant && roles.some((role) => role !== 'ECOSYSTEM')) return false
      if (!matchesSearch(ecosystem, filters.search)) return false
      if (!filters.showUntrusted && ecosystem.trustData?.trustStatus === 'UNTRUSTED') return false
      return true
    })
  }, [actingCorporationId, ecosystemsList, filters, rolesByEcosystem])

  const gridLoading = (ecosystemsLoading && ecosystemsList.length === 0) || roleFiltersPending(filters, rolesLoading)

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
              onClick={() => setAddEcosystem(true)}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-9 gap-2 px-3.5 shadow-xs [&_svg]:size-3.5 [&>svg:last-child]:text-primary-foreground/80'
              )}
            />
          }
        />
      </BlurFade>

      <EcosystemsFilterBar value={filters} onChange={setFilters} />

      <section id="ecosystems-grid" aria-busy={gridLoading || undefined} className="mb-8">
        {failureReason ? (
          <div className="error-pane mb-4">{translate('ecosystems.roles.failed', { reason: failureReason })}</div>
        ) : null}
        {gridLoading ? (
          <EcosystemGridSkeleton count={ECOSYSTEMS_PAGE_SIZE} className={GRID_CLASS} />
        ) : (
          <>
            {filtered.length === 0 ? (
              <EmptyState
                className="border-dashed bg-card/50"
                icon={<SearchXIcon />}
                title={tr('datatable.ecosystem.empty', 'No ecosystems match your filters.')}
              />
            ) : (
              <Stagger className={GRID_CLASS} initial={introPlayed ? false : 'hidden'}>
                {filtered.map((ecosystem) => (
                  <StaggerItem key={ecosystem.id} className="h-full">
                    <EcosystemCard
                      ecosystem={ecosystem}
                      enrichment={ecosystem.trustData}
                      roles={rolesByEcosystem[ecosystem.id]}
                      controlled={ecosystem.corporationId === actingCorporationId}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            <KeysetPagination
              showing={filtered.length}
              itemsLabel={tr('datatable.ecosystem.pagination.ecosystems', 'ecosystems')}
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
    </PageTransition>
  )
}
