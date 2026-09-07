'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'
import AddEcosystemPage from '@/ecosystems/add/add'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { DidEnrichment, fetchDidEnrichment } from '@/lib/resolverClient'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemCardSkeleton from '@/ui/common/ecosystem-card-skeleton'
import EcosystemsFilterBar, {
  EcosystemsFilterState,
  INITIAL_ECOSYSTEMS_FILTER,
} from '@/ui/common/ecosystems-filter-bar'
import EcosystemsPagination from '@/ui/common/ecosystems-pagination'
import { ModalAction } from '@/ui/common/modal-action'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { resolveTranslatable } from '@/ui/dataview/types'

const PAGE_SIZE = 9

function matchesSearch(ecosystem: EcosystemListItem, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return [ecosystem.did, ecosystem.corporationId, ecosystem.role, ecosystem.id].some(
    (value) => value != null && String(value).toLowerCase().includes(q)
  )
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
  const {
    ecosystemsList,
    ecosystemsLoading,
    refetch: refetchEcosystems,
    onlyActiveEcosystem,
    setOnlyActiveEcosystem,
  } = useEcosystemsCtx()
  const { corporation } = useUserCorporation()

  const [filters, setFilters] = useState<EcosystemsFilterState>({
    ...INITIAL_ECOSYSTEMS_FILTER,
    showArchived: !onlyActiveEcosystem,
  })
  const [page, setPage] = useState<number>(1)
  const [addEcosystem, setAddEcosystem] = useState(false)
  const [enrichmentState, setEnrichmentState] = useState<{
    key: string
    map: Record<string, DidEnrichment>
  }>({ key: '', map: {} })

  const didsKey = useMemo(() => ecosystemsList.map((ecosystem) => ecosystem.did).join('|'), [ecosystemsList])

  useEffect(() => {
    const dids = didsKey ? didsKey.split('|') : []
    if (dids.length === 0) {
      setEnrichmentState({ key: didsKey, map: {} })
      return
    }
    let cancelled = false
    Promise.allSettled(dids.map((did) => fetchDidEnrichment(did))).then((results) => {
      if (cancelled) return
      const next: Record<string, DidEnrichment> = {}
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          next[dids[idx]] = result.value
        }
      })
      setEnrichmentState({ key: didsKey, map: next })
    })
    return () => {
      cancelled = true
    }
  }, [didsKey])

  const enrichments = enrichmentState.map
  const enrichmentsReady = enrichmentState.key === didsKey

  const filtered = useMemo(() => {
    return ecosystemsList.filter((ecosystem) => {
      if (!filters.showArchived && ecosystem.archived) return false
      const isOwned = ecosystem.corporationId === corporation?.id || isOwnedRole(ecosystem.role)
      if (filters.hideOwned && isOwned) return false
      if (filters.hideParticipant && hasParticipantRole(ecosystem.role)) return false
      if (!matchesSearch(ecosystem, filters.search)) return false
      if (!filters.showUntrusted && enrichments[ecosystem.did]?.trustStatus === 'UNTRUSTED') {
        return false
      }
      return true
    })
  }, [corporation?.id, ecosystemsList, enrichments, filters])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

  const enrichmentGateActive = !filters.showUntrusted
  const hasEcosystems = ecosystemsList.length > 0
  const gridLoading = (ecosystemsLoading && !hasEcosystems) || (enrichmentGateActive && !enrichmentsReady)

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
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => setAddEcosystem(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('datatable.ecosystem.add', 'Create Ecosystem')}
            </button>
          </div>
        </div>
      </section>

      <EcosystemsFilterBar
        value={filters}
        onChange={(nextFilters) => {
          setFilters(nextFilters)
          setOnlyActiveEcosystem(!nextFilters.showArchived)
          setPage(1)
        }}
      />

      <section id="ecosystems-grid" className="mb-8">
        {gridLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <EcosystemCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {pageItems.length === 0 ? (
              <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
                {t('datatable.ecosystem.empty', 'No ecosystems match your filters.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {pageItems.map((ecosystem) => (
                  <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} />
                ))}
              </div>
            )}

            <EcosystemsPagination
              page={safePage}
              pageCount={pageCount}
              showing={pageItems.length}
              total={total}
              onChange={setPage}
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
