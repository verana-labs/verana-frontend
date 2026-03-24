'use client';

import { usePendingFlatPermissions } from '@/hooks/usePendingFlatPermissions';
import { useTrustRegistries } from '@/hooks/useTrustRegistries';
import { TrList } from '@/ui/datatable/columnslist/tr';
import { TrustRegistriesPermission } from '@/ui/dataview/datasections/perm';
import React, { createContext, useContext, useMemo } from 'react';

type PendingTasksCtxValue = {
  permissionsList: TrustRegistriesPermission[];
  refetch: () => Promise<void>;
};
const PendingTasksContext = createContext<PendingTasksCtxValue | undefined>(undefined);

type EcosystemsCtxValue = {
  ecosystemsList: TrList[];
  refetch: () => Promise<void>;
};
const EcosystemsContext = createContext<EcosystemsCtxValue | undefined>(undefined);

export function RestQueryProvider({ children }: { children: React.ReactNode }) {

  const { permissionsList, refetch: fetchPermissions } = usePendingFlatPermissions();
  const { trList, refetch: fetchTrList } = useTrustRegistries(false);

  const pendingTasksValue = useMemo(
    () => ({
      permissionsList,
      refetch: fetchPermissions,
    }),
    [permissionsList, fetchPermissions]
  );

  const ecosystemsValue = useMemo(
    () => ({
      ecosystemsList: trList,
      refetch: fetchTrList,
    }),
    [trList, fetchTrList]
  );


  return (
    <PendingTasksContext.Provider value={pendingTasksValue}>
      <EcosystemsContext.Provider value={ecosystemsValue}>
      {children}
      </EcosystemsContext.Provider>
    </PendingTasksContext.Provider>
  );
}

export function usePendingTasksCtx() {
  const ctx = useContext(PendingTasksContext);
  if (!ctx) throw new Error('usePendingTasksCtx must be used within RestQueryProvider');
  return ctx;
}

export function useEcosytemsCtx() {
  const ctx = useContext(EcosystemsContext);
  if (!ctx) throw new Error('useEcosytemsCtx must be used within RestQueryProvider');
  return ctx;
}
