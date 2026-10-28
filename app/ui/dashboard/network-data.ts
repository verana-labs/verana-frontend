'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA,
  VERANA_REST_ENDPOINT_ECOSYSTEM,
  VERANA_REST_ENDPOINT_STATS,
} from '@/config/env'
import { parseEcosystemsResponse } from '@/hooks/useEcosystems'
import { logger } from '@/lib/logger'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import type { ParticipantRoles } from '@/ui/dataview/datasections/dashboard'

export type Range = '24h' | '7d' | '30d' | '90d'

export const RANGES: Record<Range, { hours: number; granularity: 'HOUR' | 'DAY'; bucketHours: number }> = {
  '24h': { hours: 24, granularity: 'HOUR', bucketHours: 1 },
  '7d': { hours: 24 * 7, granularity: 'HOUR', bucketHours: 6 },
  '30d': { hours: 24 * 30, granularity: 'DAY', bucketHours: 24 },
  '90d': { hours: 24 * 90, granularity: 'DAY', bucketHours: 24 },
}

export type NetworkPoint = {
  timestamp: string
  issuedDelta: number
  verifiedDelta: number
  participantsDelta: number
}

export type SchemaSummary = {
  id: number
  ecosystem_id: number
  title: string
  description: string
  participants: number
  issued: number
  verified: number
  issuer_onboarding_mode: string
}

export type Role = 'ecosystem' | 'issuer' | 'verifier' | 'holder' | 'issuerGrantor' | 'verifierGrantor'
export type RoleCount = { role: Role; participants: number }

export type Remote<T> = { data: T | null; error: boolean; retry: () => void }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function count(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function useRemote<T>(url: string | undefined, parse: (json: unknown) => T): Remote<T> & { loading: boolean } {
  const [result, setResult] = useState<{ url: string; value: T } | null>(null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!url || attempt < 0) return
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`${url} answered ${response.status}`)
        return response.json() as Promise<unknown>
      })
      .then((json) => {
        setResult({ url, value: parse(json) })
        setFailedUrl(null)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        logger.error(reason)
        setFailedUrl(url)
      })
    return () => controller.abort()
  }, [url, parse, attempt])

  const retry = useCallback(() => {
    setFailedUrl(null)
    setAttempt((n) => n + 1)
  }, [])
  const data = result && result.url === url ? result.value : null
  const error = !url || (failedUrl === url && data === null)
  return { data, error, retry, loading: data === null && !error }
}

function parseSchemas(json: unknown): SchemaSummary[] {
  const list = isRecord(json) && Array.isArray(json.schemas) ? json.schemas : []
  return list.filter(isRecord).map((schema) => ({
    id: count(schema.id),
    ecosystem_id: count(schema.ecosystem_id),
    title: typeof schema.title === 'string' ? schema.title : '',
    description: typeof schema.description === 'string' ? schema.description : '',
    participants: count(schema.participants),
    issued: count(schema.issued),
    verified: count(schema.verified),
    issuer_onboarding_mode: typeof schema.issuer_onboarding_mode === 'string' ? schema.issuer_onboarding_mode : '',
  }))
}

const HOUR_MS = 3_600_000

type SeriesWindow = { from: number; until: number; step: number }

function seriesWindow(range: Range, now: number): SeriesWindow {
  const { hours, bucketHours } = RANGES[range]
  const step = bucketHours * HOUR_MS
  const until = Math.ceil(now / HOUR_MS) * HOUR_MS
  const from = Math.floor((until - hours * HOUR_MS) / step) * step
  return { from, until, step }
}

export function fillBuckets(json: unknown, { from, until, step }: SeriesWindow): NetworkPoint[] {
  const buckets = isRecord(json) && Array.isArray(json.buckets) ? json.buckets : []
  const points: NetworkPoint[] = []
  for (let time = from; time < until; time += step) {
    points.push({ timestamp: new Date(time).toISOString(), issuedDelta: 0, verifiedDelta: 0, participantsDelta: 0 })
  }
  for (const bucket of buckets.filter(isRecord)) {
    const time = Date.parse(String(bucket.timestamp))
    const point = Number.isFinite(time) ? points[Math.floor((time - from) / step)] : undefined
    if (!point) continue
    point.issuedDelta += count(bucket.delta_issued)
    point.verifiedDelta += count(bucket.delta_verified)
    point.participantsDelta += count(bucket.delta_participants)
  }
  return points
}

export function useLatestSchemas(limit = 12): Remote<SchemaSummary[]> {
  return useRemote(
    VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA
      ? `${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/list?response_max_size=${limit}`
      : undefined,
    parseSchemas
  )
}

const TOP_ECOSYSTEMS_WINDOW = 200

export function useTopEcosystems(): Remote<EcosystemListItem[]> & { loading: boolean } {
  return useRemote(
    VERANA_REST_ENDPOINT_ECOSYSTEM
      ? `${VERANA_REST_ENDPOINT_ECOSYSTEM}/list?trust_data=full&archived=false&sort=-id&limit=${TOP_ECOSYSTEMS_WINDOW}`
      : undefined,
    parseEcosystemsResponse
  )
}

export function useNetworkSeries(range: Range): Remote<NetworkPoint[]> & { loading: boolean } {
  const hour = Math.ceil(Date.now() / HOUR_MS)
  const { url, parse } = useMemo(() => {
    const window = seriesWindow(range, hour * HOUR_MS)
    const { granularity } = RANGES[range]
    const params = new URLSearchParams({
      entity_type: 'GLOBAL',
      granularity,
      timestamp_from: new Date(window.from).toISOString(),
      timestamp_until: new Date(window.until).toISOString(),
      result_type: 'BUCKETS',
    })
    return {
      url: VERANA_REST_ENDPOINT_STATS ? `${VERANA_REST_ENDPOINT_STATS}/stats?${params}` : undefined,
      parse: (json: unknown) => fillBuckets(json, window),
    }
  }, [range, hour])
  return useRemote(url, parse)
}

export function rolesOf(roles: ParticipantRoles | null | undefined): RoleCount[] | null {
  if (!roles) return null
  const all: RoleCount[] = [
    { role: 'ecosystem', participants: roles.ecosystem },
    { role: 'issuer', participants: roles.issuer },
    { role: 'verifier', participants: roles.verifier },
    { role: 'holder', participants: roles.holder },
    { role: 'issuerGrantor', participants: roles.issuerGrantor },
    { role: 'verifierGrantor', participants: roles.verifierGrantor },
  ]
  return all.filter((r) => r.participants > 0 || ['ecosystem', 'issuer', 'verifier', 'holder'].includes(r.role))
}
