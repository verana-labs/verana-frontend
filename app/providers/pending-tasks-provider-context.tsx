'use client';

import { usePendingFlatPermissions } from '@/hooks/usePendingFlatPermissions';
import { TrustRegistriesPermission } from '@/ui/dataview/datasections/perm';
import React, { createContext, useContext } from 'react';

type PendingTasksCtxValue = {
  permissionsList: TrustRegistriesPermission[];
  refetch: () => Promise<void>;
};

const PendingTasksContext = createContext<PendingTasksCtxValue | undefined>(undefined);

export function PendingTasksProvider({ children }: { children: React.ReactNode }) {
  const { permissionsList, refetch } = usePendingFlatPermissions();

  return (
    <PendingTasksContext.Provider value={{ permissionsList, refetch }}>
      {children}
    </PendingTasksContext.Provider>
  );
}

export function usePendingTasksCtx() {
  const ctx = useContext(PendingTasksContext);
  if (!ctx) throw new Error('usePendingTasksCtx must be used within PendingTasksProvider');
  return ctx.permissionsList;
}

export function useUpdatePendingTasksCtx() {
  const ctx = useContext(PendingTasksContext);
  if (!ctx) throw new Error('useUpdatePendingTasksCtx must be used within PendingTasksProvider');
  return ctx.refetch; // “refresh”
}