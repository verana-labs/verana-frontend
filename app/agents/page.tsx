'use client'

import { BotIcon, Building2Icon, LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useIndexerEntityEvents } from '@/providers/indexer-events-provider'
import AgentCard from '@/ui/agents/agent-card'
import { AgentCardSkeleton } from '@/ui/agents/agent-card-skeleton'
import AgentsFilterBar, { type AgentsFilterState, INITIAL_AGENTS_FILTER } from '@/ui/agents/agents-filter-bar'
import { CorporationRequired } from '@/ui/agents-tasks-settings/corporation-required'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import { PartialNote } from '@/ui/corporation/shared'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

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
  const [filters, setFilters] = useState<AgentsFilterState>(INITIAL_AGENTS_FILTER)
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
          <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
          {translate('agents.loading')}
        </p>
        <AgentsSkeletonGrid />
      </div>
    )
  }
  if (!actingCorporation)
    return (
      <CorporationRequired
        failed={Boolean(discoveryError)}
        title={translate('agents.title')}
        description={translate('agents.description')}
      />
    )

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

      <BlurFade delay={0.05} className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AgentsFilterBar value={filters} onChange={setFilters} />
        {!loading && !error && agents.length > 0 ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {translate('agents.summary', { count: visible.length, total: agents.length })}
            {visible.length < agents.length && !filters.showUnverifiable ? (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, showUnverifiable: true })}
                className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {translate('participants.filters.showall')}
              </button>
            ) : null}
          </p>
        ) : null}
      </BlurFade>

      {degradedKeys.length > 0 ? (
        <div
          role="status"
          className="mb-6 flex gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning dark:bg-warning/15"
        >
          <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
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
          <Empty className="border border-dashed border-border bg-card py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BotIcon />
              </EmptyMedia>
              <EmptyTitle>{translate('agents.empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
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
        {(!error || partialError) && !loading && hasNext ? <ShowMoreButton onClick={loadMore} /> : null}
      </section>
    </>
  )
}
