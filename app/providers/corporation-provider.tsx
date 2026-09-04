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
  lostActingCorporation,
  saveActingCorporationId,
  type UserCorporation,
} from '@/lib/corporation-discovery'
import { logger } from '@/lib/logger'

export interface CorporationContextValue {
  memberships: CorporationMembership[]
  acting: CorporationMembership | null
  lost: UserCorporation | null
  needsSelection: boolean
  selectionRequested: boolean
  loading: boolean
  errorCorporation: string | null
  setActing: (corporationId: number) => void
  requestSelection: () => void
  dismissLost: () => void
  refetch: () => Promise<void>
  revalidate: () => Promise<void>
}

const CorporationContext = createContext<CorporationContextValue | null>(null)

export function CorporationProvider({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [memberships, setMemberships] = useState<CorporationMembership[]>([])
  const [actingId, setActingId] = useState<number | null>(null)
  const [lost, setLost] = useState<UserCorporation | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorCorporation, setError] = useState<string | null>(null)
  const [selectionRequested, setSelectionRequested] = useState(false)

  const requestRef = useRef(0)
  const sessionAddressRef = useRef<string | undefined>(undefined)
  const membershipsRef = useRef(memberships)
  membershipsRef.current = memberships
  const actingIdRef = useRef(actingId)
  actingIdRef.current = actingId

  const resolve = useCallback(
    async (silent: boolean) => {
      const requestId = ++requestRef.current
      if (!address) {
        if (sessionAddressRef.current) clearActingCorporation()
        sessionAddressRef.current = undefined
        setMemberships([])
        setActingId(null)
        setLost(null)
        setSelectionRequested(false)
        setError(null)
        setLoading(false)
        return
      }
      const previousActingId = sessionAddressRef.current === address ? actingIdRef.current : null
      sessionAddressRef.current = address
      if (!silent) setLoading(true)
      setError(null)
      try {
        const discovered = await discoverCorporations(address)
        if (requestRef.current !== requestId) return
        const lostCorporation = lostActingCorporation(previousActingId, membershipsRef.current, discovered)
        setMemberships(discovered)
        setSelectionRequested(false)
        if (lostCorporation) {
          clearActingCorporation()
          setActingId(null)
          setLost(lostCorporation)
          return
        }
        const chosen = chooseActingMembership(discovered, loadActingCorporationId(address))
        if (chosen) saveActingCorporationId(address, chosen.corporation.id)
        setActingId(chosen?.corporation.id ?? null)
      } catch (error) {
        if (requestRef.current !== requestId) return
        if (silent) {
          logger.error('corporation revalidation', error)
          return
        }
        setMemberships([])
        setActingId(null)
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        if (requestRef.current === requestId) setLoading(false)
      }
    },
    [address]
  )

  useEffect(() => {
    void resolve(false)
  }, [resolve])

  useEffect(() => {
    if (!address) return
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void resolve(true)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [address, resolve])

  const setActing = useCallback(
    (corporationId: number) => {
      const membership = memberships.find((entry) => entry.corporation.id === corporationId)
      if (!membership || !address) return
      saveActingCorporationId(address, corporationId)
      setActingId(corporationId)
      setSelectionRequested(false)
    },
    [memberships, address]
  )

  const requestSelection = useCallback(() => {
    if (memberships.length > 0) setSelectionRequested(true)
  }, [memberships.length])

  const dismissLost = useCallback(() => {
    setLost(null)
    if (membershipsRef.current.length > 0) setSelectionRequested(true)
  }, [])

  const refetch = useCallback(() => resolve(false), [resolve])
  const revalidate = useCallback(() => resolve(true), [resolve])

  const value = useMemo<CorporationContextValue>(() => {
    const acting = memberships.find((entry) => entry.corporation.id === actingId) ?? null
    return {
      memberships,
      acting,
      lost,
      needsSelection: !loading && !acting && memberships.length > 1,
      selectionRequested,
      loading,
      errorCorporation,
      setActing,
      requestSelection,
      dismissLost,
      refetch,
      revalidate,
    }
  }, [
    memberships,
    actingId,
    lost,
    loading,
    errorCorporation,
    setActing,
    requestSelection,
    dismissLost,
    selectionRequested,
    refetch,
    revalidate,
  ])

  return <CorporationContext.Provider value={value}>{children}</CorporationContext.Provider>
}

export function useCorporationContext(): CorporationContextValue {
  const context = useContext(CorporationContext)
  if (!context) throw new Error('useCorporationContext requires a CorporationProvider')
  return context
}
