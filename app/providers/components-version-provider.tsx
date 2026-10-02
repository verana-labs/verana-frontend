'use client'

import { createContext, useContext, useState } from 'react'
import { APP_VERSION } from '@/config/env'
import { useChainVersion } from '@/hooks/useChainVersion'
import { useComponentsHealth } from '@/hooks/useComponentsHealth'
import { useIndexerVersion } from '@/hooks/useIndexerVersion'
import type { ChainHealth, IndexerHealth } from '@/lib/component-health'

const ComponentsVersionContext = createContext<ComponentsVersionContextType | null>(null)

export function ComponentsVersionProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<ComponentsVersionState>({
    ledger: {
      version: null,
      health: null,
    },
    indexer: {
      version: null,
      lastProcessedBlock: null,
      health: null,
    },
    frontend: {
      version: (() => {
        const v = APP_VERSION
        if (!v) return null
        return v.startsWith('v') ? v : `v${v}`
      })(),
    },
  })

  return (
    <ComponentsVersionContext.Provider value={{ state, setState }}>
      <VersionBootstrap />
      {children}
    </ComponentsVersionContext.Provider>
  )
}

function VersionBootstrap() {
  useChainVersion()
  useIndexerVersion()
  useComponentsHealth()
  return null
}

export function useComponentsVersion() {
  const ctx = useContext(ComponentsVersionContext)
  if (!ctx) {
    throw new Error('useComponentsVersion must be used inside ComponentsVersionProvider')
  }
  return ctx
}

type ComponentsVersionState = {
  ledger: {
    version: string | null
    health: ChainHealth | null
  }
  indexer: {
    version: string | null
    lastProcessedBlock: number | null
    health: IndexerHealth | null
  }
  frontend: {
    version: string | null
  }
}

type ComponentsVersionContextType = {
  state: ComponentsVersionState
  setState: React.Dispatch<React.SetStateAction<ComponentsVersionState>>
}
