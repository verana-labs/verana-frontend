'use client'

import { faBuilding } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useIndexerEntityEvents } from '@/providers/indexer-events-provider'
import AgentCard from '@/ui/agents/agent-card'
import AgentsFilterBar, { type AgentsFilterState, INITIAL_AGENTS_FILTER } from '@/ui/agents/agents-filter-bar'
import EcosystemCardSkeleton from '@/ui/common/ecosystem-card-skeleton'

const SKELETONS = 3

export default function AgentsPage() {
  const { actingCorporation, loading: actingLoading } = useUserCorporation()
  const [filters, setFilters] = useState<AgentsFilterState>(INITIAL_AGENTS_FILTER)
  const { agents, delegations, resolutions, loading, error, applyEvents } = useAgents(
    actingCorporation?.corporation,
    filters.includeInactive
  )
  useIndexerEntityEvents(applyEvents)

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
    return <p className="p-6 text-sm text-gray-500">{translate('agents.loading')}</p>
  }
  if (!actingCorporation) {
    return <p className="p-6 text-sm text-gray-600 dark:text-gray-300">{translate('corporation.page.nocorp')}</p>
  }

  return (
    <>
      <section id="page-header" className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">{translate('agents.title')}</h1>
            <p className="page-description">{translate('agents.description')}</p>
          </div>
          <Link
            href="/corporation?tab=operators#agents"
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <FontAwesomeIcon icon={faBuilding} />
            {translate('agents.rawlink')}
          </Link>
        </div>
      </section>

      <AgentsFilterBar value={filters} onChange={setFilters} />

      <section id="agents-grid" className="mb-8">
        {error ? <div className="p-6 error-pane">{translate('agents.error')}</div> : null}
        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {[...Array(SKELETONS)].map((_, index) => (
              <EcosystemCardSkeleton key={index} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
            {translate('agents.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {visible.map((agent) => (
              <AgentCard
                key={agent.did}
                agent={agent}
                resolution={resolutions.get(agent.did)}
                delegations={delegations}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
