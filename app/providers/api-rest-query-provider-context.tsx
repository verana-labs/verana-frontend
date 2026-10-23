'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type AccountBalanceData, useAccountBalance } from '@/hooks/useAccountBalance'
import { type EcosystemSchemaPage, useCredentialSchemasByEcosystem } from '@/hooks/useCredentialSchemas'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useEcosystems } from '@/hooks/useEcosystems'
import { usePendingParticipants } from '@/hooks/usePendingParticipants'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { type DiscoverFilters, INITIAL_DISCOVER_FILTERS, needsFullWindow } from '@/lib/discover-list'
import { coalesceIndexerEvents, refreshTargets } from '@/lib/indexer-event'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { DashboardData } from '@/ui/dataview/datasections/dashboard'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'
import { shortenDID } from '@/util/util'

type PendingTasksCtxValue = {
  pendingParticipants: PendingEcosystem[]
  partial: boolean
  loading: boolean
  settled: boolean
  error: string | null
  refetch: () => Promise<void>
}

type KeysetPageControls = {
  hasNext: boolean
  hasPrevious: boolean
  nextPage: () => void
  previousPage: () => void
}

type DiscoverCtxValue = KeysetPageControls & {
  discoverList: EcosystemListItem[]
  credentialSchemasByEcosystem: Record<string, EcosystemSchemaPage>
  errorCredentialSchemas: string | null
  moreSchemaErrors: Record<string, string>
  loadMoreCredentialSchemas: (ecosystemId: string) => void
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  discoverFilters: DiscoverFilters
  setDiscoverFilters: React.Dispatch<React.SetStateAction<DiscoverFilters>>
  discoverSearch: string
  fullWindow: boolean
  setShownEcosystemIds: (ids: string[]) => void
}

type EcosystemsCtxValue = KeysetPageControls & {
  ecosystemsList: EcosystemListItem[]
  ecosystemsLoading: boolean
  refetch: () => Promise<void>
  onlyActiveEcosystem: boolean
  setOnlyActiveEcosystem: React.Dispatch<React.SetStateAction<boolean>>
  ecosystemFilters: Record<string, string | boolean>
  setEcosystemFilters: React.Dispatch<React.SetStateAction<Record<string, string | boolean>>>
}

type AccountCtxValue = {
  accountData: AccountBalanceData
  refetch: () => Promise<void>
}

type DashboardCtxValue = {
  dashboardData: DashboardData | null
  refetch: () => Promise<void>
}

export const DISCOVER_PAGE_SIZE = 5
// The indexer caps limit at 1024 and the keyset request asks for one extra row.
export const DISCOVER_FULL_WINDOW = 1024 - 1
const DISCOVER_SEARCH_DEBOUNCE_MS = 300

const PendingTasksContext = createContext<PendingTasksCtxValue | undefined>(undefined)
const DiscoverContext = createContext<DiscoverCtxValue | undefined>(undefined)
const EcosystemsContext = createContext<EcosystemsCtxValue | undefined>(undefined)
const AccountContext = createContext<AccountCtxValue | undefined>(undefined)
const DashboardContext = createContext<DashboardCtxValue | undefined>(undefined)

export function RestQueryProvider({ children }: { children: React.ReactNode }) {
  const { dashboardData, refetch: refetchDashboard } = useDashboardData()
  const { accountData, refetch: refetchAccountData } = useAccountBalance()
  const {
    pendingParticipants,
    partial: pendingParticipantsPartial,
    loading: pendingParticipantsLoading,
    settled: pendingParticipantsSettled,
    errorPendingParticipants,
    refetch: refetchPendingParticipants,
  } = usePendingParticipants()

  const [onlyActiveEcosystem, setOnlyActiveEcosystem] = useState(true)
  const [ecosystemFilters, setEcosystemFilters] = useState<Record<string, string | boolean>>({})
  const {
    ecosystems: ecosystemsList,
    loading: ecosystemsLoading,
    refetch: refetchEcosystems,
    hasNext: ecosystemsHasNext,
    hasPrevious: ecosystemsHasPrevious,
    nextPage: ecosystemsNextPage,
    previousPage: ecosystemsPreviousPage,
  } = useEcosystems(false, onlyActiveEcosystem)

  const [discoverFilters, setDiscoverFilters] = useState<DiscoverFilters>(INITIAL_DISCOVER_FILTERS)
  const discoverSearch = useDebouncedValue(discoverFilters.search, DISCOVER_SEARCH_DEBOUNCE_MS)
  const fullWindow = needsFullWindow({ ...discoverFilters, search: discoverSearch })
  const [shownEcosystemIds, setShownEcosystemIds] = useState<string[]>([])
  const {
    ecosystems: discoverList,
    loading: discoverLoading,
    errorEcosystems: discoverError,
    refetch: refetchDiscoverList,
    hasNext: discoverHasNext,
    hasPrevious: discoverHasPrevious,
    nextPage: discoverNextPage,
    previousPage: discoverPreviousPage,
  } = useEcosystems(true, !discoverFilters.showArchived, fullWindow ? DISCOVER_FULL_WINDOW : DISCOVER_PAGE_SIZE)
  const discoverEcosystemIds = useMemo(
    () => (fullWindow ? shownEcosystemIds : discoverList.map((ecosystem) => ecosystem.id)),
    [discoverList, fullWindow, shownEcosystemIds]
  )
  const {
    schemasByEcosystem: credentialSchemasByEcosystem,
    loading: credentialSchemasLoading,
    errorCredentialSchemas,
    moreSchemaErrors,
    refetch: refetchCredentialSchemas,
    loadMore: loadMoreCredentialSchemas,
  } = useCredentialSchemasByEcosystem(discoverEcosystemIds)

  const refetchDiscover = React.useCallback(async () => {
    await Promise.all([refetchDiscoverList(), refetchCredentialSchemas()])
  }, [refetchDiscoverList, refetchCredentialSchemas])

  const { addIndexerEventListener } = useIndexerEvents()
  const { actingCorporation } = useUserCorporation()

  // Events of the acting Corporation drive the targeted refreshes of [VFE-DATA-WS-3].
  useEffect(() => {
    const actingCorporationId = actingCorporation?.corporation.id
    if (actingCorporationId === undefined) return
    const coalesced = coalesceIndexerEvents((_corporationId, events) => {
      const targets = new Set(events.flatMap(refreshTargets))
      if (targets.has('participants')) void refetchPendingParticipants()
      if (targets.has('ecosystems')) void refetchEcosystems()
      if (targets.has('credentialSchemas')) void refetchCredentialSchemas()
      if (targets.has('dashboard')) void refetchDashboard()
    })
    const unsubscribe = addIndexerEventListener((corporationId, events) => {
      if (corporationId === actingCorporationId) coalesced.listener(corporationId, events)
    })
    return () => {
      unsubscribe()
      coalesced.cancel()
    }
  }, [
    actingCorporation,
    addIndexerEventListener,
    refetchPendingParticipants,
    refetchEcosystems,
    refetchCredentialSchemas,
    refetchDashboard,
  ])

  const pendingTasksValue = useMemo(
    () => ({
      pendingParticipants,
      partial: pendingParticipantsPartial,
      loading: pendingParticipantsLoading,
      settled: pendingParticipantsSettled,
      error: errorPendingParticipants,
      refetch: refetchPendingParticipants,
    }),
    [
      pendingParticipants,
      pendingParticipantsPartial,
      pendingParticipantsLoading,
      pendingParticipantsSettled,
      errorPendingParticipants,
      refetchPendingParticipants,
    ]
  )

  const discoverValue = useMemo(
    () => ({
      discoverList,
      loading: discoverLoading || credentialSchemasLoading,
      error: discoverError,
      refetch: refetchDiscover,
      credentialSchemasByEcosystem,
      errorCredentialSchemas,
      moreSchemaErrors,
      loadMoreCredentialSchemas,
      discoverFilters,
      setDiscoverFilters,
      discoverSearch,
      fullWindow,
      setShownEcosystemIds,
      hasNext: discoverHasNext,
      hasPrevious: discoverHasPrevious,
      nextPage: discoverNextPage,
      previousPage: discoverPreviousPage,
    }),
    [
      discoverList,
      discoverLoading,
      credentialSchemasByEcosystem,
      credentialSchemasLoading,
      discoverError,
      errorCredentialSchemas,
      moreSchemaErrors,
      loadMoreCredentialSchemas,
      refetchDiscover,
      discoverFilters,
      discoverSearch,
      fullWindow,
      discoverHasNext,
      discoverHasPrevious,
      discoverNextPage,
      discoverPreviousPage,
    ]
  )

  const ecosystemsValue = useMemo(
    () => ({
      ecosystemsList,
      ecosystemsLoading,
      refetch: refetchEcosystems,
      onlyActiveEcosystem,
      setOnlyActiveEcosystem,
      ecosystemFilters,
      setEcosystemFilters,
      hasNext: ecosystemsHasNext,
      hasPrevious: ecosystemsHasPrevious,
      nextPage: ecosystemsNextPage,
      previousPage: ecosystemsPreviousPage,
    }),
    [
      ecosystemsList,
      ecosystemsLoading,
      refetchEcosystems,
      onlyActiveEcosystem,
      ecosystemFilters,
      ecosystemsHasNext,
      ecosystemsHasPrevious,
      ecosystemsNextPage,
      ecosystemsPreviousPage,
    ]
  )

  const accountValue = useMemo(
    () => ({
      accountData,
      refetch: refetchAccountData,
    }),
    [accountData, refetchAccountData]
  )

  const dashboardValue = useMemo(
    () => ({
      dashboardData,
      refetch: refetchDashboard,
    }),
    [dashboardData, refetchDashboard]
  )

  return (
    <PendingTasksContext.Provider value={pendingTasksValue}>
      <DiscoverContext.Provider value={discoverValue}>
        <EcosystemsContext.Provider value={ecosystemsValue}>
          <AccountContext.Provider value={accountValue}>
            <DashboardContext.Provider value={dashboardValue}>{children}</DashboardContext.Provider>
          </AccountContext.Provider>
        </EcosystemsContext.Provider>
      </DiscoverContext.Provider>
    </PendingTasksContext.Provider>
  )
}

export function usePendingTasksCtx() {
  const ctx = useContext(PendingTasksContext)
  if (!ctx) throw new Error('usePendingTasksCtx must be used within RestQueryProvider')
  return ctx
}

export function useDiscoverCtx() {
  const ctx = useContext(DiscoverContext)
  if (!ctx) throw new Error('useDiscoverCtx must be used within RestQueryProvider')
  return ctx
}

// Schema titles and ecosystem DIDs for ids, from the loaded discover window; the id is the fallback.
export function useRegistryLabels() {
  const { credentialSchemasByEcosystem, discoverList } = useDiscoverCtx()
  return useMemo(() => {
    const schemas = new Map(
      Object.values(credentialSchemasByEcosystem).flatMap((page) =>
        page.items.map((schema) => [schema.id, schema.title] as const)
      )
    )
    const ecosystems = new Map(discoverList.map((ecosystem) => [ecosystem.id, ecosystem.did]))
    return {
      schemaLabel: (id: number | null) => (id === null ? '' : schemas.get(String(id)) || `#${id}`),
      ecosystemLabel: (id: number | null) => {
        if (id === null) return ''
        const did = ecosystems.get(String(id))
        return did ? shortenDID(did) : `#${id}`
      },
    }
  }, [credentialSchemasByEcosystem, discoverList])
}

export function useEcosystemsCtx() {
  const ctx = useContext(EcosystemsContext)
  if (!ctx) throw new Error('useEcosystemsCtx must be used within RestQueryProvider')
  return ctx
}

export function useAccountCtx() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccountCtx must be used within RestQueryProvider')
  return ctx
}

export function useDashboardCtx() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboardCtx must be used within RestQueryProvider')
  return ctx
}
