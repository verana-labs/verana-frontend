// trust-deposit-params-context.tsx
'use client';

import { createContext, useContext } from 'react';
import type { TrustDepositParams } from "@/app/lib/trustDepositParams";

const TrustDepositParamsContext = createContext<TrustDepositParams | undefined>(undefined);

export function TrustDepositParamsProvider({
  value,
  children,
}: {
  value: TrustDepositParams;
  children: React.ReactNode;
}) {
  return (
    <TrustDepositParamsContext.Provider value={value}>
      {children}
    </TrustDepositParamsContext.Provider>
  );
}

export function useTrustDepositParams() {
  const ctx = useContext(TrustDepositParamsContext);
  if (!ctx) throw new Error('useTrustDepositParams must be used within <ClientLayout>');
  return ctx;
}