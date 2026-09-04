'use client'

import { useChain } from '@cosmos-kit/react'
import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_GROUP, VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { logger } from '@/lib/logger'

export interface CorporationAttention {
  pendingTasks: number
  pendingVotes: number
}

async function countRows(url: string, key: string): Promise<number> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  const payload: unknown = await response.json()
  const rows = (payload as Record<string, unknown>)[key]
  return Array.isArray(rows) ? rows.length : 0
}

async function fetchAttention(corporationId: number, account: string): Promise<CorporationAttention> {
  const [pendingTasks, pendingVotes] = await Promise.all([
    VERANA_REST_ENDPOINT_PARTICIPANT
      ? countRows(
          `${VERANA_REST_ENDPOINT_PARTICIPANT}/pending/flat?corporation_id=${corporationId}&limit=1024`,
          'participants'
        )
      : Promise.resolve(0),
    VERANA_REST_ENDPOINT_GROUP
      ? countRows(
          `${VERANA_REST_ENDPOINT_GROUP}/proposals?corporation_id=${corporationId}&pending_voter=${encodeURIComponent(account)}&limit=1024`,
          'proposals'
        )
      : Promise.resolve(0),
  ])
  return { pendingTasks, pendingVotes }
}

export function useCorporationAttention(memberships: CorporationMembership[]) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [attention, setAttention] = useState<Record<number, CorporationAttention>>({})

  const ids = memberships.map((membership) => membership.corporation.id).join(',')

  useEffect(() => {
    if (!address || ids.length === 0) {
      setAttention({})
      return
    }
    let cancelled = false
    void Promise.all(
      ids.split(',').map(async (id) => {
        try {
          return [Number(id), await fetchAttention(Number(id), address)] as const
        } catch (error) {
          logger.error('corporation attention', error)
          return [Number(id), { pendingTasks: 0, pendingVotes: 0 }] as const
        }
      })
    ).then((entries) => {
      if (!cancelled) setAttention(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [ids, address])

  return attention
}
