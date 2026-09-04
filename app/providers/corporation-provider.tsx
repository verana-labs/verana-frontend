'use client'

import { useChain } from '@cosmos-kit/react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { type CorporationAttention, fetchAttention } from '@/lib/corporation-attention'
import {
  type CorporationMembership,
  chooseActingMembership,
  claimIntendedMembership,
  discoverCorporations,
  forgetActingCorporationId,
  invalidatesActingSession,
  lostActingCorporation,
  mergeKnownMemberships,
  restoreActingMembership,
  saveActingCorporationId,
  type UserCorporation,
} from '@/lib/corporation-discovery'
import { logger } from '@/lib/logger'

export interface CorporationContextValue {
  memberships: CorporationMembership[]
  actingCorporation: CorporationMembership | null
  lost: UserCorporation | null
  needsSelection: boolean
  loading: boolean
  error: string | null
  actingCorporationLost: boolean
  attention: Record<number, CorporationAttention>
  setActingCorporation: (corporationId: number) => void
  actAsOnceDiscovered: (corporationId: number) => void
  dismissLost: () => void
  refetch: () => Promise<void>
  revalidate: () => Promise<void>
}

export const CorporationContext = createContext<CorporationContextValue | null>(null)

export function CorporationProvider({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain()
  const { address, isWalletDisconnected } = useChain(veranaChain.chain_name)
  const [memberships, setMemberships] = useState<CorporationMembership[]>([])
  const [actingCorporationId, setActingCorporationId] = useState<number | null>(null)
  const [lost, setLost] = useState<UserCorporation | null>(null)
  const [attention, setAttention] = useState<Record<number, CorporationAttention>>({})
  const [actingCorporationLost, setActingCorporationLost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)
  const lastAccount = useRef<string | undefined>(undefined)
  const knownMemberships = useRef<CorporationMembership[]>([])
  const intendedActingId = useRef<number | null>(null)
  const actingCorporation = memberships.find((membership) => membership.corporation.id === actingCorporationId) ?? null
  const actingCorporationRef = useRef(actingCorporation)
  actingCorporationRef.current = actingCorporation

  const discover = useCallback(async (account: string, silent: boolean) => {
    const run = ++runId.current
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    const discovered = await discoverCorporations(account)
    if (run !== runId.current) return
    if (silent && discovered.error) {
      logger.error('corporation revalidation', discovered.error)
      return
    }
    const known = discovered.error
      ? mergeKnownMemberships(knownMemberships.current, discovered.memberships)
      : discovered.memberships
    knownMemberships.current = known
    const intended = claimIntendedMembership(account, known, intendedActingId.current)
    if (intended) intendedActingId.current = null
    const lostCorporation =
      discovered.error || intended ? null : lostActingCorporation(actingCorporationRef.current, known)
    setMemberships(known)
    if (intended) {
      setActingCorporationId(intended.corporation.id)
      setActingCorporationLost(false)
      setLost(null)
    } else if (lostCorporation) {
      forgetActingCorporationId(account)
      setActingCorporationId(null)
      setActingCorporationLost(false)
      setLost(lostCorporation)
    } else {
      const restored = restoreActingMembership(account, known, discovered.error !== null)
      setActingCorporationId(restored.membership?.corporation.id ?? null)
      setActingCorporationLost(restored.lost)
    }
    setError(discovered.error)
    setLoading(false)
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
    }
    if (address) lastAccount.current = address
    runId.current += 1
    knownMemberships.current = []
    intendedActingId.current = null
    actingCorporationRef.current = null
    setMemberships([])
    setActingCorporationId(null)
    setActingCorporationLost(false)
    setLost(null)
    setAttention({})
    setError(null)
    if (!address) {
      setLoading(false)
      return
    }
    void discover(address, false)
  }, [address, isWalletDisconnected, discover])

  const revalidate = useCallback(async () => {
    if (address && !loading) await discover(address, true)
  }, [address, loading, discover])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void revalidate()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [revalidate])

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
      if (address) void discover(address, false)
    },
    [address, discover]
  )

  const dismissLost = useCallback(() => {
    setLost(null)
    const only = chooseActingMembership(memberships, null)
    if (only) setActingCorporation(only.corporation.id)
  }, [memberships, setActingCorporation])

  const refetch = useCallback(async () => {
    if (address) await discover(address, false)
  }, [address, discover])

  const value = useMemo<CorporationContextValue>(
    () => ({
      memberships,
      actingCorporation,
      lost,
      needsSelection: !loading && !actingCorporation && !lost && memberships.length > 0,
      loading,
      error,
      actingCorporationLost,
      attention,
      setActingCorporation,
      actAsOnceDiscovered,
      dismissLost,
      refetch,
      revalidate,
    }),
    [
      memberships,
      actingCorporation,
      lost,
      loading,
      error,
      actingCorporationLost,
      attention,
      setActingCorporation,
      actAsOnceDiscovered,
      dismissLost,
      refetch,
      revalidate,
    ]
  )

  return <CorporationContext.Provider value={value}>{children}</CorporationContext.Provider>
}
