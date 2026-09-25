'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import { useCredentialSchemasByEcosystem } from '@/hooks/useCredentialSchemas'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useEcosystems } from '@/hooks/useEcosystems'
import { usePendingParticipants } from '@/hooks/usePendingParticipants'
import { TrustDepositAccountData, useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { DashboardData } from '@/ui/dataview/datasections/dashboard'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'

type PendingTasksCtxValue = {
  pendingParticipants: PendingEcosystem[]
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
  credentialSchemasByEcosystem: Record<string, CredentialSchemaListItem[]>
  loading: boolean
  refetch: () => Promise<void>
  discoverSearch: string
  setDiscoverSearch: React.Dispatch<React.SetStateAction<string>>
  hideUntrustedOnDiscover: boolean
  setHideUntrustedOnDiscover: React.Dispatch<React.SetStateAction<boolean>>
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
  accountData: TrustDepositAccountData
  refetch: () => Promise<void>
}

type DashboardCtxValue = {
  dashboardData: DashboardData | null
  refetch: () => Promise<void>
}

export const DISCOVER_PAGE_SIZE = 5

const PendingTasksContext = createContext<PendingTasksCtxValue | undefined>(undefined)
const DiscoverContext = createContext<DiscoverCtxValue | undefined>(undefined)
const EcosystemsContext = createContext<EcosystemsCtxValue | undefined>(undefined)
const AccountContext = createContext<AccountCtxValue | undefined>(undefined)
const DashboardContext = createContext<DashboardCtxValue | undefined>(undefined)

export function RestQueryProvider({ children }: { children: React.ReactNode }) {
  const { dashboardData, refetch: refetchDashboard } = useDashboardData()
  const { accountData, refetch: refetchAccountData } = useTrustDepositAccountData()
  const {
    pendingParticipants,
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

  const [discoverSearch, setDiscoverSearch] = useState<string>('')
  // The filter starts off: [VFE-PAGE-DISCOVER-1] lists every non-archived Ecosystem.
  const [hideUntrustedOnDiscover, setHideUntrustedOnDiscover] = useState(false)
  const {
    ecosystems: discoverList,
    loading: discoverLoading,
    refetch: refetchDiscoverList,
    hasNext: discoverHasNext,
    hasPrevious: discoverHasPrevious,
    nextPage: discoverNextPage,
    previousPage: discoverPreviousPage,
  } = useEcosystems(true, true, DISCOVER_PAGE_SIZE)
  const discoverEcosystemIds = useMemo(() => discoverList.map((ecosystem) => ecosystem.id), [discoverList])
  const {
    schemasByEcosystem: credentialSchemasByEcosystem,
    loading: credentialSchemasLoading,
    refetch: refetchCredentialSchemas,
  } = useCredentialSchemasByEcosystem(discoverEcosystemIds)

  const refetchDiscover = React.useCallback(async () => {
    await Promise.all([refetchDiscoverList(), refetchCredentialSchemas()])
  }, [refetchDiscoverList, refetchCredentialSchemas])

  const pendingTasksValue = useMemo(
    () => ({
      pendingParticipants,
      loading: pendingParticipantsLoading,
      settled: pendingParticipantsSettled,
      error: errorPendingParticipants,
      refetch: refetchPendingParticipants,
    }),
    [
      pendingParticipants,
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
      refetch: refetchDiscover,
      credentialSchemasByEcosystem,
      discoverSearch,
      setDiscoverSearch,
      hideUntrustedOnDiscover,
      setHideUntrustedOnDiscover,
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
      refetchDiscover,
      discoverSearch,
      hideUntrustedOnDiscover,
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
