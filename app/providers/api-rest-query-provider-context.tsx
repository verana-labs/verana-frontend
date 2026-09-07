'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import { useCredentialSchemas } from '@/hooks/useCredentialSchemas'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useEcosystems } from '@/hooks/useEcosystems'
import { usePendingParticipants } from '@/hooks/usePendingParticipants'
import { TrustDepositAccountData, useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData'
import type { KeysetPaging } from '@/lib/keyset'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { DashboardData } from '@/ui/dataview/datasections/dashboard'
import type { PendingEcosystem } from '@/ui/dataview/datasections/participant'

const ECOSYSTEMS_PAGE_SIZE = 9
const DISCOVER_PAGE_SIZE = 5

type PendingTasksCtxValue = {
  pendingParticipants: PendingEcosystem[]
  refetch: () => Promise<void>
}

type DiscoverCtxValue = {
  discoverList: EcosystemListItem[]
  credentialSchemas: CredentialSchemaListItem[]
  loading: boolean
  refetch: () => Promise<void>
  paging: KeysetPaging
  discoverSearch: string
  setDiscoverSearch: React.Dispatch<React.SetStateAction<string>>
}

type EcosystemsCtxValue = {
  ecosystemsList: EcosystemListItem[]
  ecosystemsLoading: boolean
  refetch: () => Promise<void>
  paging: KeysetPaging
  onlyActiveEcosystem: boolean
  setOnlyActiveEcosystem: React.Dispatch<React.SetStateAction<boolean>>
}

type AccountCtxValue = {
  accountData: TrustDepositAccountData
  refetch: () => Promise<void>
}

type DashboardCtxValue = {
  dashboardData: DashboardData | null
  refetch: () => Promise<void>
}

const PendingTasksContext = createContext<PendingTasksCtxValue | undefined>(undefined)
const DiscoverContext = createContext<DiscoverCtxValue | undefined>(undefined)
const EcosystemsContext = createContext<EcosystemsCtxValue | undefined>(undefined)
const AccountContext = createContext<AccountCtxValue | undefined>(undefined)
const DashboardContext = createContext<DashboardCtxValue | undefined>(undefined)

export function RestQueryProvider({ children }: { children: React.ReactNode }) {
  const { dashboardData, refetch: refetchDashboard } = useDashboardData()
  const { accountData, refetch: refetchAccountData } = useTrustDepositAccountData()
  const { pendingParticipants, refetch: refetchPendingParticipants } = usePendingParticipants()

  const [onlyActiveEcosystem, setOnlyActiveEcosystem] = useState(true)
  const {
    ecosystems: ecosystemsList,
    loading: ecosystemsLoading,
    refetch: refetchEcosystems,
    paging: ecosystemsPaging,
  } = useEcosystems({ all: false, onlyActive: onlyActiveEcosystem, pageSize: ECOSYSTEMS_PAGE_SIZE })

  const [discoverSearch, setDiscoverSearch] = useState<string>('')
  const {
    ecosystems: discoverList,
    loading: discoverLoading,
    refetch: refetchDiscoverList,
    paging: discoverPaging,
  } = useEcosystems({ all: true, onlyActive: true, pageSize: DISCOVER_PAGE_SIZE })
  const {
    credentialSchemas,
    loading: credentialSchemasLoading,
    refetch: refetchCredentialSchemas,
  } = useCredentialSchemas(undefined, true)

  const refetchDiscover = React.useCallback(async () => {
    await Promise.all([refetchDiscoverList(), refetchCredentialSchemas()])
  }, [refetchDiscoverList, refetchCredentialSchemas])

  const pendingTasksValue = useMemo(
    () => ({
      pendingParticipants,
      refetch: refetchPendingParticipants,
    }),
    [pendingParticipants, refetchPendingParticipants]
  )

  const discoverValue = useMemo(
    () => ({
      discoverList,
      loading: discoverLoading || credentialSchemasLoading,
      refetch: refetchDiscover,
      paging: discoverPaging,
      credentialSchemas,
      discoverSearch,
      setDiscoverSearch,
    }),
    [
      discoverList,
      discoverLoading,
      discoverPaging,
      credentialSchemas,
      credentialSchemasLoading,
      refetchDiscover,
      discoverSearch,
    ]
  )

  const ecosystemsValue = useMemo(
    () => ({
      ecosystemsList,
      ecosystemsLoading,
      refetch: refetchEcosystems,
      paging: ecosystemsPaging,
      onlyActiveEcosystem,
      setOnlyActiveEcosystem,
    }),
    [ecosystemsList, ecosystemsLoading, refetchEcosystems, ecosystemsPaging, onlyActiveEcosystem]
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
