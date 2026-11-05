'use client'

import { BotIcon, Building2Icon, CloudOffIcon, LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { usePersistedFilters } from '@/hooks/usePersistedFilters'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useIndexerEntityEvents } from '@/providers/indexer-events-provider'
import AgentCard from '@/ui/agents/agent-card'
import { AgentCardSkeleton } from '@/ui/agents/agent-card-skeleton'
import AgentsFilterBar, { INITIAL_AGENTS_FILTER } from '@/ui/agents/agents-filter-bar'
import { EmptyState } from '@/ui/common/empty-state'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import { PartialNote } from '@/ui/corporation/shared'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'

const SKELETONS = 4
const GRID = 'grid grid-cols-1 items-start gap-4 xl:grid-cols-2'

function AgentsSkeletonGrid() {
  return (
    <div className={GRID}>
      {Array.from({ length: SKELETONS }, (_, index) => (
        <AgentCardSkeleton key={index} />
      ))}
    </div>
  )
}

export default function AgentsPage() {
  const { actingCorporation, loading: actingLoading, error: discoveryError } = useUserCorporation()
  const [filters, setFilters] = usePersistedFilters('agents', INITIAL_AGENTS_FILTER)
  const {
    agents,
    delegations,
    pending,
    delegationsPartial,
    degraded,
    resolutions,
    unavailableDids,
    loading,
    error,
    hasNext,
    loadMore,
    applyEvents,
  } = useAgents(actingCorporation?.corporation, filters.includeInactive)
  useIndexerEntityEvents(actingCorporation?.corporation.id, applyEvents)

  const partialError = Boolean(error) && agents.length > 0

  // Per [VFE-PAGE-AGENTS-7] the trust gate never hides a pinned Corporation or Ecosystem DID.
  const visible = useMemo(
    () =>
      agents.filter(
        (agent) =>
          agent.pinned || filters.showUnverifiable || resolutions.get(agent.did)?.enrichment.trustStatus === 'TRUSTED'
      ),
    [agents, filters.showUnverifiable, resolutions]
  )

  if (actingLoading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin text-primary" />
          {translate('agents.loading')}
        </p>
        <AgentsSkeletonGrid />
      </div>
    )
  }
  if (!actingCorporation) {
    return (
      <EmptyState
        className="bg-card/50 py-16"
        icon={discoveryError ? <CloudOffIcon /> : <Building2Icon />}
        title={translate(discoveryError ? 'corporation.page.error' : 'corporation.page.nocorp')}
      />
    )
  }

  const degradedKeys = [
    degraded.ecosystems && 'agents.degraded.ecosystems',
    degraded.delegations && 'agents.degraded.delegations',
    degraded.pending && 'agents.degraded.pending',
    partialError && 'agents.error.more',
  ].filter((key): key is string => Boolean(key))

  return (
    <>
      <BlurFade>
        <section id="page-header" className="mb-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="page-title">{translate('agents.title')}</h1>
              <p className="page-description">{translate('agents.description')}</p>
            </div>
            <Button asChild variant="outline" size="lg" className="w-fit px-3">
              <Link href="/corporation?tab=operators#agents">
                <Building2Icon aria-hidden="true" />
                {translate('agents.rawlink')}
              </Link>
            </Button>
          </div>
        </section>
      </BlurFade>

      <BlurFade delay={0.05} className="mb-6">
        <AgentsFilterBar value={filters} onChange={setFilters} />
      </BlurFade>

      {degradedKeys.length > 0 ? (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-xl bg-tint-warning py-3 ps-3 pe-4 text-sm text-warning ring-1 ring-warning/25"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-hairline">
            <TriangleAlertIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col gap-1 pt-1.5 text-foreground">
            {degradedKeys.map((key) => (
              <p key={key}>{translate(key)}</p>
            ))}
          </div>
        </div>
      ) : null}

      <section id="agents-grid" className="mb-8">
        {hasNext ? <PartialNote filtered /> : null}
        {delegationsPartial ? <PartialNote /> : null}
        {error && !partialError ? (
          <div className="error-pane">{translate('agents.error')}</div>
        ) : loading ? (
          <AgentsSkeletonGrid />
        ) : visible.length === 0 ? (
          <EmptyState icon={<BotIcon />} title={translate('agents.empty')} className="bg-card py-14" />
        ) : (
          <Stagger className={GRID}>
            {visible.map((agent) => (
              <StaggerItem key={agent.did}>
                <AgentCard
                  agent={agent}
                  resolution={resolutions.get(agent.did)}
                  unavailable={unavailableDids.has(agent.did)}
                  delegations={delegations}
                  pending={pending}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
        {(!error || partialError) && !loading && hasNext ? (
          <div className="mt-4 flex justify-center">
            <ShowMoreButton onClick={loadMore} />
          </div>
        ) : null}
      </section>
    </>
  )
}
