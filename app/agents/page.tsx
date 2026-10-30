'use client'

import {
  BotIcon,
  Building2Icon,
  GlobeIcon,
  HourglassIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react'
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
import { EmptyState } from '@/ui/common/empty-state'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import { ScoreGauge } from '@/ui/common/score-gauge'
import { StatTile, UnknownStat } from '@/ui/common/stat-tile'
import { PartialNote } from '@/ui/corporation/shared'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'

const SKELETONS = 4
const GRID = 'grid grid-cols-1 items-start gap-4 xl:grid-cols-2'
const STAT_ITEM = 'w-[42%] min-w-36 shrink-0 snap-start sm:w-auto sm:min-w-0'

type AgentStatsProps = {
  total: number
  more: boolean
  trusted: number
  ecosystems: number | null
  pending: number | null
}

function AgentStats({ total, more, trusted, ecosystems, pending }: AgentStatsProps) {
  const suffix = more ? '+' : ''
  const trustedPercent = total > 0 ? (trusted / total) * 100 : 0
  return (
    <Stagger
      tabIndex={0}
      aria-label={translate('agents.stats')}
      className="-mx-4 mb-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:mx-0 sm:mb-6 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
    >
      <StaggerItem className={STAT_ITEM}>
        <StatTile icon={<BotIcon />} label={translate('agents.title')} value={`${total}${suffix}`} />
      </StaggerItem>
      <StaggerItem className={STAT_ITEM}>
        <StatTile
          icon={<ShieldCheckIcon />}
          label={translate('participant.labelTrustState.trusted')}
          value={trusted}
          pattern={false}
          hint={
            <ScoreGauge
              percent={trustedPercent}
              tone="brand"
              size="sm"
              label={`${translate('participant.labelTrustState.trusted')} ${Math.round(trustedPercent)}%`}
              className="max-w-40"
            />
          }
        />
      </StaggerItem>
      <StaggerItem className={STAT_ITEM}>
        <StatTile
          icon={<GlobeIcon />}
          label={translate('ecosystemList.title')}
          value={ecosystems === null ? <UnknownStat /> : ecosystems}
          pattern={false}
        />
      </StaggerItem>
      <StaggerItem className={STAT_ITEM}>
        <StatTile
          icon={<HourglassIcon />}
          label={translate('agents.stats.pending')}
          value={pending === null ? <UnknownStat /> : pending}
          pattern={false}
        />
      </StaggerItem>
    </Stagger>
  )
}

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
          <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin text-primary" />
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

  const trustedCount = agents.filter((agent) => resolutions.get(agent.did)?.enrichment.trustStatus === 'TRUSTED').length
  const showStats = !loading && (!error || partialError) && agents.length > 0

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
          <p
            className="flex h-7 w-fit items-center gap-2 rounded-full bg-card px-3 text-xs font-medium text-muted-foreground tabular-nums shadow-hairline"
            aria-live="polite"
          >
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

      {showStats ? (
        <AgentStats
          total={agents.length}
          more={hasNext}
          trusted={trustedCount}
          ecosystems={degraded.ecosystems ? null : agents.filter((agent) => agent.label === 'ecosystem').length}
          pending={degraded.pending ? null : pending.length}
        />
      ) : null}

      {degradedKeys.length > 0 ? (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-xl bg-tint-warning py-3 ps-3 pe-4 text-sm text-warning ring-1 ring-warning/25"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-hairline">
            <TriangleAlertIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col gap-1 pt-1.5 font-medium">
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
        {(!error || partialError) && !loading && hasNext ? <ShowMoreButton onClick={loadMore} /> : null}
      </section>
    </>
  )
}
