import { useChain } from '@cosmos-kit/react'
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { GUEST_FILTER_OWNER, type ListFilterScope, loadListFilters, saveListFilters } from '@/lib/list-filters'

function useFilterOwner(): string {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  return address ?? GUEST_FILTER_OWNER
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
    if (applied.current?.owner === owner) return
    const next = loadListFilters(scope, owner, defaults) ?? defaults
    applied.current = { owner, filters: next }
    setFilters(next)
  }, [owner, scope, defaults, setFilters])

  useEffect(() => {
    if (applied.current?.owner !== owner || applied.current.filters === filters) return
    applied.current = { owner, filters }
    saveListFilters(scope, owner, filters)
  }, [owner, scope, filters])
}

export function usePersistedFilters<T extends object>(
  scope: ListFilterScope,
  defaults: T
): [T, Dispatch<SetStateAction<T>>] {
  const owner = useFilterOwner()
  const [restoredFor] = useState(owner)
  const [filters, setFilters] = useState(() => loadListFilters(scope, owner, defaults) ?? defaults)
  useFilterPersistence(scope, filters, setFilters, defaults, restoredFor)
  return [filters, setFilters]
}
