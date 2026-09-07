'use client'

import { useChain } from '@cosmos-kit/react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { type CorporationAttention, fetchAttention } from '@/lib/corporation-attention'
import {
  type CorporationMembership,
  discoverCorporations,
  forgetActingCorporationId,
  hasWalletSession,
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
  attention: Record<number, CorporationAttention>
  setActingCorporation: (corporationId: number) => void
  refetch: () => Promise<void>
}

export const CorporationContext = createContext<CorporationContextValue | null>(null)

export function CorporationProvider({ children }: { children: React.ReactNode }) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [memberships, setMemberships] = useState<CorporationMembership[]>([])
  const [actingCorporationId, setActingCorporationId] = useState<number | null>(null)
  const [attention, setAttention] = useState<Record<number, CorporationAttention>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)
  const lastAccount = useRef<string | undefined>(undefined)
  const knownMemberships = useRef<CorporationMembership[]>([])

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
    setMemberships(known)
    setActingCorporationId(restoreActingMembership(account, known, discovered.error !== null)?.corporation.id ?? null)
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
    if (lastAccount.current && lastAccount.current !== address && (address || !hasWalletSession())) {
      forgetActingCorporationId(lastAccount.current)
    }
    if (address) lastAccount.current = address
    runId.current += 1
    knownMemberships.current = []
    setMemberships([])
    setActingCorporationId(null)
    setAttention({})
    setError(null)
    if (!address) {
      setLoading(false)
      return
    }
    void discover(address)
  }, [address, discover])

  const setActingCorporation = useCallback(
    (corporationId: number) => {
      if (!address || !memberships.some((membership) => membership.corporation.id === corporationId)) return
      saveActingCorporationId(address, corporationId)
      setActingCorporationId(corporationId)
    },
    [address, memberships]
  )

  const refetch = useCallback(async () => {
    if (address) await discover(address)
  }, [address, discover])

  const value = useMemo<CorporationContextValue>(() => {
    const actingCorporation =
      memberships.find((membership) => membership.corporation.id === actingCorporationId) ?? null
    return {
      memberships,
      actingCorporation,
      needsSelection: !loading && !actingCorporation && memberships.length > 0,
      loading,
      error,
      attention,
      setActingCorporation,
      refetch,
    }
  }, [memberships, actingCorporationId, loading, error, attention, setActingCorporation, refetch])

  return <CorporationContext.Provider value={value}>{children}</CorporationContext.Provider>
}
