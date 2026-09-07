'use client'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useMemo, useState } from 'react'
import AddEcosystemPage from '@/ecosystems/add/add'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import { EntityActionButton } from '@/ui/common/capability-button'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EcosystemCardSkeleton from '@/ui/common/ecosystem-card-skeleton'
import EcosystemsFilterBar, {
  EcosystemsFilterState,
  INITIAL_ECOSYSTEMS_FILTER,
} from '@/ui/common/ecosystems-filter-bar'
import { KeysetPager, LoadedWindowNote } from '@/ui/common/keyset-pager'
import { ModalAction } from '@/ui/common/modal-action'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { resolveTranslatable } from '@/ui/dataview/types'

const SKELETON_COUNT = 9

function matchesSearch(ecosystem: EcosystemListItem, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return [
    ecosystem.did,
    ecosystem.corporationId,
    ecosystem.role,
    ecosystem.id,
    ecosystem.trust?.serviceName,
    ecosystem.trust?.organizationName,
  ].some((value) => value != null && String(value).toLowerCase().includes(q))
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
    paging,
    onlyActiveEcosystem,
    setOnlyActiveEcosystem,
  } = useEcosystemsCtx()
  const { actingCorporation } = useUserCorporation()

  const [filters, setFilters] = useState<EcosystemsFilterState>({
    ...INITIAL_ECOSYSTEMS_FILTER,
    showArchived: !onlyActiveEcosystem,
  })
  const [addEcosystem, setAddEcosystem] = useState(false)

  const filtered = useMemo(() => {
    return ecosystemsList.filter((ecosystem) => {
      if (!filters.showArchived && ecosystem.archived) return false
      const isOwned = ecosystem.corporationId === actingCorporation?.corporation.id || isOwnedRole(ecosystem.role)
      if (filters.hideOwned && isOwned) return false
      if (filters.hideParticipant && hasParticipantRole(ecosystem.role)) return false
      if (!matchesSearch(ecosystem, filters.search)) return false
      if (!filters.showUntrusted && ecosystem.trust?.trustStatus === 'UNTRUSTED') return false
      return true
    })
  }, [actingCorporation?.corporation.id, ecosystemsList, filters])

  const t = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

  const gridLoading = ecosystemsLoading && ecosystemsList.length === 0

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
            <EntityActionButton
              msgType="MsgCreateEcosystem"
              icon={faPlus}
              label={t('datatable.ecosystem.add', 'Create Ecosystem')}
              onClick={() => setAddEcosystem(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            />
          </div>
        </div>
      </section>

      <EcosystemsFilterBar
        value={filters}
        onChange={(nextFilters) => {
          setFilters(nextFilters)
          setOnlyActiveEcosystem(!nextFilters.showArchived)
        }}
      />

      <section id="ecosystems-grid" className="mb-8">
        <LoadedWindowNote partial={paging.partial} />
        {gridLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(SKELETON_COUNT)].map((_, i) => (
              <EcosystemCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center text-sm text-neutral-70 dark:text-neutral-70">
                {t('datatable.ecosystem.empty', 'No ecosystems match your filters.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((ecosystem) => (
                  <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} />
                ))}
              </div>
            )}

            <KeysetPager paging={paging} showing={ecosystemsList.length} loading={ecosystemsLoading} />
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
