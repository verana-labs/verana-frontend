'use client'

import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_STATS } from '@/config/env'
import { useDashboardCtx, useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'

export type Range = '24h' | '7d' | '30d' | '90d'

export type NetworkPoint = {
  timestamp: string
  issued: number
  verified: number
  participants: number
  ecosystems: number
  issuedDelta: number
  verifiedDelta: number
  participantsDelta: number
}

export const RANGES: Record<Range, { hours: number; granularity: 'HOUR' | 'DAY' }> = {
  '24h': { hours: 24, granularity: 'HOUR' },
  '7d': { hours: 24 * 7, granularity: 'HOUR' },
  '30d': { hours: 24 * 30, granularity: 'DAY' },
  '90d': { hours: 24 * 90, granularity: 'DAY' },
}

type Bucket = {
  timestamp: string
  cumulative_issued: number
  cumulative_verified: number
  cumulative_participants: number
  cumulative_active_ecosystems: number
  delta_issued: number
  delta_verified: number
  delta_participants: number
}

export function useNetworkSeries(range: Range): { points: NetworkPoint[]; loading: boolean } {
  const [points, setPoints] = useState<NetworkPoint[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!VERANA_REST_ENDPOINT_STATS) return
    const { hours, granularity } = RANGES[range]
    const until = new Date()
    const from = new Date(until.getTime() - hours * 3_600_000)
    const params = new URLSearchParams({
      entity_type: 'GLOBAL',
      granularity,
      timestamp_from: from.toISOString(),
      timestamp_until: until.toISOString(),
      result_type: 'BUCKETS',
    })
    const controller = new AbortController()
    setLoading(true)
    fetch(`${VERANA_REST_ENDPOINT_STATS}/stats?${params}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ buckets?: Bucket[] }>)
      .then(({ buckets = [] }) => {
        setPoints(
          buckets.map((b) => ({
            timestamp: b.timestamp,
            issued: b.cumulative_issued,
            verified: b.cumulative_verified,
            participants: b.cumulative_participants,
            ecosystems: b.cumulative_active_ecosystems,
            issuedDelta: b.delta_issued,
            verifiedDelta: b.delta_verified,
            participantsDelta: b.delta_participants,
          }))
        )
        setLoading(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [range])
  return { points, loading }
}

export function useLabDashboard() {
  const { latestProcessedHeight } = useIndexerEvents()
  const dashboardCtx = useDashboardCtx()
  const discoverCtx = useDiscoverCtx()

  useEffect(() => {
    void dashboardCtx.refetch()
  }, [dashboardCtx.refetch])

  return {
    stats: { ...dashboardCtx.dashboardData, blockHeight: latestProcessedHeight || null },
    ecosystems: discoverCtx.discoverList,
    ecosystemsLoading: discoverCtx.loading && discoverCtx.discoverList.length === 0,
    pager: discoverCtx,
  }
}
