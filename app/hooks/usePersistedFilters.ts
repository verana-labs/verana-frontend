'use client'

import { useChain } from '@cosmos-kit/react'
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { type ListFilterScope, loadListFilters, saveListFilters } from '@/lib/list-filters'

function useFilterOwner(): string | undefined {
  const veranaChain = useVeranaChain()
  return useChain(veranaChain.chain_name).address
}

export function useFilterPersistence<T extends object>(
  scope: ListFilterScope,
  filters: T,
  setFilters: (filters: T) => void,
  defaults: T,
  restoredFor?: string
): void {
  const owner = useFilterOwner()
  const applied = useRef<{ owner: string; filters: T } | null>(
    restoredFor === undefined ? null : { owner: restoredFor, filters }
  )

  useEffect(() => {
    if (!owner) return
    if (applied.current?.owner !== owner) {
      const restored = loadListFilters(scope, owner, defaults) ?? defaults
      applied.current = { owner, filters: restored }
      setFilters(restored)
      return
    }
    if (applied.current.filters === filters) return
    applied.current = { owner, filters }
    saveListFilters(scope, owner, filters)
  }, [owner, scope, filters, defaults, setFilters])
}

export function usePersistedFilters<T extends object>(
  scope: ListFilterScope,
  defaults: T
): [T, Dispatch<SetStateAction<T>>] {
  const owner = useFilterOwner()
  const [restoredFor] = useState(owner)
  const [filters, setFilters] = useState(() => (owner && loadListFilters(scope, owner, defaults)) || defaults)
  useFilterPersistence(scope, filters, setFilters, defaults, restoredFor)
  return [filters, setFilters]
}
