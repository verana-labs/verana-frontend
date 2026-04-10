'use client';

import { createContext, useContext, useState } from "react";
import { useChainVersion } from '@/hooks/useChainVersion';
import { useIndexerVersion } from '@/hooks/useIndexerVersion';

const ComponentsVersionContext = createContext<ComponentsVersionContextType | null>(null);

export function ComponentsVersionProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<ComponentsVersionState>({
    ledger: {
      version: null,
    },
    indexer: {
      version: null,
      lastProcessedBlock: null,
    },
    frontend: {
      version: (() => {
        const v = process.env.NEXT_PUBLIC_APP_VERSION;
        if (!v) return null;
        return v.startsWith("v") ? v : `v${v}`;
        })(),
    },
  });

  return (
    <ComponentsVersionContext.Provider value={{ state, setState }}>
      <VersionBootstrap />
      {children}
    </ComponentsVersionContext.Provider>
  );
}

function VersionBootstrap() {
  useChainVersion();
  useIndexerVersion();
  return null;
}

export function useComponentsVersion() {
  const ctx = useContext(ComponentsVersionContext);
  if (!ctx) {
    throw new Error("useComponentsVersion must be used inside ComponentsVersionProvider");
  }
  return ctx;
}

type ComponentsVersionState = {
  ledger: {
    version: string | null;
  };
  indexer: {
    version: string | null;
    lastProcessedBlock: number | null;
  };
  frontend: {
    version: string | null;
  };
};

type ComponentsVersionContextType = {
  state: ComponentsVersionState;
  setState: React.Dispatch<React.SetStateAction<ComponentsVersionState>>;
};