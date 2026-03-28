'use client';

import { useCSList } from '@/hooks/useCredentialSchemas';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePendingFlatPermissions } from '@/hooks/usePendingFlatPermissions';
import { TrustDepositAccountData, useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData';
import { useTrustRegistries } from '@/hooks/useTrustRegistries';
import { CsList } from '@/ui/datatable/columnslist/cs';
import { TrList } from '@/ui/datatable/columnslist/tr';
import { DashboardData } from '@/ui/dataview/datasections/dashboard';
import { TrustRegistriesPermission } from '@/ui/dataview/datasections/perm';
import React, { createContext, useContext, useMemo, useState } from 'react';

type PendingTasksCtxValue = {
  permissionsList: TrustRegistriesPermission[];
  refetch: () => Promise<void>;
};

type DiscoverCtxValue = {
  discoverList: TrList[];
  csList: CsList[];
  refetch: () => Promise<void>;
  discoverSearch: string;
  setDiscoverSearch: React.Dispatch<React.SetStateAction<string>>;
  discoverPage: number;
  setDiscoverPage: React.Dispatch<React.SetStateAction<number>>;
};

type EcosystemsCtxValue = {
  ecosystemsList: TrList[];
  refetch: () => Promise<void>;
  onlyActiveEcosystem: boolean;
  setOnlyActiveEcosystem: React.Dispatch<React.SetStateAction<boolean>>;
  ecosystemFilters: Record<string, string | boolean>;
  setEcosystemFilters: React.Dispatch<React.SetStateAction<Record<string, string | boolean>>>;
};

type AccountCtxValue = {
  accountData: TrustDepositAccountData;
  refetch: () => Promise<void>;
};

type DashboardCtxValue = {
  dashboardData: DashboardData | null;
  refetch: () => Promise<void>;
};

const PendingTasksContext = createContext<PendingTasksCtxValue | undefined>(undefined);
const DiscoverContext = createContext<DiscoverCtxValue | undefined>(undefined);
const EcosystemsContext = createContext<EcosystemsCtxValue | undefined>(undefined);
const AccountContext = createContext<AccountCtxValue | undefined>(undefined);
const DashboardContext = createContext<DashboardCtxValue | undefined>(undefined);

export function RestQueryProvider({ children }: { children: React.ReactNode }) {
  
  const { dashboardData, refetch: refetchDashboard } = useDashboardData();
  const { accountData, refetch: refetchAccountData } = useTrustDepositAccountData();
  const { permissionsList, refetch: refetchPermissions } = usePendingFlatPermissions();
  
  const [ onlyActiveEcosystem, setOnlyActiveEcosystem ] = useState(true);
  const [ ecosystemFilters, setEcosystemFilters ] = useState<Record<string, string | boolean>>({});
  const { trList: ecosystemsList, refetch: refetchEcosystems } = useTrustRegistries(false, onlyActiveEcosystem);

  const [ discoverSearch, setDiscoverSearch ] = useState<string>('');
  const [ discoverPage, setDiscoverPage ] = useState<number>(1);
  const { trList: discoverList, refetch: refetchDiscoverList } = useTrustRegistries(true);
  const { csList, refetch: refetchCS } = useCSList (undefined, true);

  const refetchDiscover = React.useCallback(async () => {
    await Promise.all([refetchDiscoverList(), refetchCS()]);
  }, [refetchDiscoverList, refetchCS]);

  const pendingTasksValue = useMemo(
    () => ({
      permissionsList,
      refetch: refetchPermissions,
    }),
    [permissionsList, refetchPermissions]
  );

  const discoverValue = useMemo(
    () => ({
      discoverList,
      refetch: refetchDiscover,
      csList,
      discoverSearch,
      setDiscoverSearch,
      discoverPage,
      setDiscoverPage
    }),
    [discoverList, csList, refetchDiscover, discoverSearch, discoverPage]
  );

  const ecosystemsValue = useMemo(
    () => ({
      ecosystemsList,
      refetch: refetchEcosystems,
      onlyActiveEcosystem,
      setOnlyActiveEcosystem,
      ecosystemFilters,
      setEcosystemFilters,
    }),
    [ecosystemsList, refetchEcosystems, onlyActiveEcosystem, ecosystemFilters]
  );

  const accountValue = useMemo(
    () => ({
      accountData,
      refetch: refetchAccountData,
    }),
    [accountData, refetchAccountData]
  );

  const dashboardValue = useMemo(
    () => ({
      dashboardData,
      refetch: refetchDashboard,
    }),
    [dashboardData, refetchDashboard]
  );

  return (
    <PendingTasksContext.Provider value={pendingTasksValue}>
    <DiscoverContext.Provider value={discoverValue}>
    <EcosystemsContext.Provider value={ecosystemsValue}>
    <AccountContext.Provider value={accountValue}>
    <DashboardContext.Provider value={dashboardValue}>
      {children}
    </DashboardContext.Provider>
    </AccountContext.Provider>
    </EcosystemsContext.Provider>
    </DiscoverContext.Provider>
    </PendingTasksContext.Provider>
  );
}

export function usePendingTasksCtx() {
  const ctx = useContext(PendingTasksContext);
  if (!ctx) throw new Error('usePendingTasksCtx must be used within RestQueryProvider');
  return ctx;
}

export function useDiscoverCtx() {
  const ctx = useContext(DiscoverContext);
  if (!ctx) throw new Error('useDiscoverCtx must be used within RestQueryProvider');
  return ctx;
}

export function useEcosytemsCtx() {
  const ctx = useContext(EcosystemsContext);
  if (!ctx) throw new Error('useEcosytemsCtx must be used within RestQueryProvider');
  return ctx;
}

export function useAccountCtx() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccountCtx must be used within RestQueryProvider');
  return ctx;
}

export function useDashboardCtx() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardCtx must be used within RestQueryProvider');
  return ctx;
}
