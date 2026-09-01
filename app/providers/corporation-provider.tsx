'use client'

import { useChain } from '@cosmos-kit/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import {
  type CorporationMembership,
  chooseActingMembership,
  clearActingCorporation,
  discoverCorporations,
  loadActingCorporationId,
  saveActingCorporationId,
} from '@/lib/corporation-discovery'

export interface CorporationContextValue {
  memberships: CorporationMembership[]
  acting: CorporationMembership | null
  needsSelection: boolean
  loading: boolean
  errorCorporation: string | null
  setActing: (corporationId: number) => void
  refetch: () => Promise<void>
}

const CorporationContext = createContext<CorporationContextValue | null>(null)

export function CorporationProvider({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [memberships, setMemberships] = useState<CorporationMembership[]>([])
  const [actingId, setActingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorCorporation, setError] = useState<string | null>(null)

  const requestRef = useRef(0)
  const hadAddressRef = useRef(false)

  const resolve = useCallback(async () => {
    const requestId = ++requestRef.current
    if (!address) {
      if (hadAddressRef.current) clearActingCorporation()
      hadAddressRef.current = false
      setMemberships([])
      setActingId(null)
      setError(null)
      setLoading(false)
      return
    }
    hadAddressRef.current = true
    setLoading(true)
    setError(null)
    try {
      const discovered = await discoverCorporations(address)
      if (requestRef.current !== requestId) return
      setMemberships(discovered)
      const chosen = chooseActingMembership(discovered, loadActingCorporationId(address))
      if (chosen) saveActingCorporationId(address, chosen.corporation.id)
      setActingId(chosen?.corporation.id ?? null)
    } catch (error) {
      if (requestRef.current !== requestId) return
      setMemberships([])
      setActingId(null)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (requestRef.current === requestId) setLoading(false)
    }
  }, [address])

  useEffect(() => {
    void resolve()
  }, [resolve])

  const setActing = useCallback(
    (corporationId: number) => {
      const membership = memberships.find((entry) => entry.corporation.id === corporationId)
      if (!membership || !address) return
      saveActingCorporationId(address, corporationId)
      setActingId(corporationId)
    },
    [memberships, address]
  )

  const value = useMemo<CorporationContextValue>(() => {
    const acting = memberships.find((entry) => entry.corporation.id === actingId) ?? null
    return {
      memberships,
      acting,
      needsSelection: !loading && !acting && memberships.length > 1,
      loading,
      errorCorporation,
      setActing,
      refetch: resolve,
    }
  }, [memberships, actingId, loading, errorCorporation, setActing, resolve])

  return <CorporationContext.Provider value={value}>{children}</CorporationContext.Provider>
}

export function useCorporationContext(): CorporationContextValue {
  const context = useContext(CorporationContext)
  if (!context) throw new Error('useCorporationContext requires a CorporationProvider')
  return context
}
