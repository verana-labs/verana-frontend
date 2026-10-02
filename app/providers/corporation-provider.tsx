'use client'

import { useChain } from '@cosmos-kit/react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { applyLocale, forgetLocale, resolveLocale } from '@/i18n/dataview'
import { type CorporationAttention, fetchAttention } from '@/lib/corporation-attention'
import {
  type CorporationMembership,
  claimIntendedMembership,
  discoverCorporations,
  forgetActingCorporationId,
  invalidatesActingSession,
  mergeKnownMemberships,
  restoreActingMembership,
  saveActingCorporationId,
} from '@/lib/corporation-discovery'

export interface CorporationContextValue {
  memberships: CorporationMembership[]
  actingCorporation: CorporationMembership | null
  needsSelection: boolean
  loading: boolean
  error: string | null
  actingCorporationLost: boolean
  acknowledgeLost: () => void
  attention: Record<number, CorporationAttention>
  setActingCorporation: (corporationId: number) => void
  actAsOnceDiscovered: (corporationId: number) => void
  refetch: () => Promise<void>
}

export const CorporationContext = createContext<CorporationContextValue | null>(null)

export function CorporationProvider({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain()
  const { address, isWalletDisconnected } = useChain(veranaChain.chain_name)
  const [memberships, setMemberships] = useState<CorporationMembership[]>([])
  const [actingCorporationId, setActingCorporationId] = useState<number | null>(null)
  const [attention, setAttention] = useState<Record<number, CorporationAttention>>({})
  const [actingCorporationLost, setActingCorporationLost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [discoveredFor, setDiscoveredFor] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)
  const lastAccount = useRef<string | undefined>(undefined)
  const knownMemberships = useRef<CorporationMembership[]>([])
  const intendedActingId = useRef<number | null>(null)

  const discover = useCallback(async (account: string) => {
    const run = ++runId.current
    setLoading(true)
    setError(null)
    const discovered = await discoverCorporations(account)
    if (run !== runId.current) return
    const known = discovered.error
      ? mergeKnownMemberships(knownMemberships.current, discovered.memberships)
      : discovered.memberships
    knownMemberships.current = known
    const intended = claimIntendedMembership(account, known, intendedActingId.current)
    if (intended) intendedActingId.current = null
    const restored = intended
      ? { membership: intended, lost: false }
      : restoreActingMembership(account, known, discovered.error !== null)
    setMemberships(known)
    setActingCorporationId(restored.membership?.corporation.id ?? null)
    setActingCorporationLost(restored.lost)
    setError(discovered.error)
    setLoading(false)
    setDiscoveredFor(account)
    if (known.length === 0) return
    const counts = await fetchAttention(
      known.map((membership) => membership.corporation.id),
      account
    )
    if (run === runId.current) setAttention(counts)
  }, [])

  useEffect(() => {
    const previousAccount = lastAccount.current
    if (previousAccount && invalidatesActingSession(previousAccount, address, isWalletDisconnected)) {
      forgetActingCorporationId(previousAccount)
      forgetLocale()
      applyLocale(resolveLocale(null, navigator.languages))
    }
    if (address) lastAccount.current = address
    runId.current += 1
    knownMemberships.current = []
    intendedActingId.current = null
    setMemberships([])
    setActingCorporationId(null)
    setActingCorporationLost(false)
    setAttention({})
    setError(null)
    setDiscoveredFor(undefined)
    if (!address) {
      setLoading(false)
      return
    }
    void discover(address)
  }, [address, isWalletDisconnected, discover])

  const setActingCorporation = useCallback(
    (corporationId: number) => {
      if (!address || !memberships.some((membership) => membership.corporation.id === corporationId)) return
      intendedActingId.current = null
      saveActingCorporationId(address, corporationId)
      setActingCorporationId(corporationId)
      setActingCorporationLost(false)
    },
    [address, memberships]
  )

  const actAsOnceDiscovered = useCallback(
    (corporationId: number) => {
      intendedActingId.current = corporationId
      if (address) void discover(address)
    },
    [address, discover]
  )

  const acknowledgeLost = useCallback(() => setActingCorporationLost(false), [])

  const refetch = useCallback(async () => {
    if (address) await discover(address)
  }, [address, discover])

  const value = useMemo<CorporationContextValue>(() => {
    const actingCorporation =
      memberships.find((membership) => membership.corporation.id === actingCorporationId) ?? null
    const pending = loading || (address !== undefined && discoveredFor !== address)
    return {
      memberships,
      actingCorporation,
      needsSelection: !pending && !actingCorporation && memberships.length > 0,
      loading: pending,
      error,
      actingCorporationLost,
      acknowledgeLost,
      attention,
      setActingCorporation,
      actAsOnceDiscovered,
      refetch,
    }
  }, [
    memberships,
    actingCorporationId,
    loading,
    address,
    discoveredFor,
    error,
    actingCorporationLost,
    acknowledgeLost,
    attention,
    setActingCorporation,
    actAsOnceDiscovered,
    refetch,
  ])

  return <CorporationContext.Provider value={value}>{children}</CorporationContext.Provider>
}
