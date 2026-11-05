'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_STATS } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { DashboardData, ParticipantRoles } from '@/ui/dataview/datasections/dashboard'
import { resolveTranslatable } from '@/ui/dataview/types'

const DIGIT_STRING = /^-?\d+$/

function metricDigits(value: unknown, field: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && DIGIT_STRING.test(value)) return value
  throw new Error(`Invalid V4 stats snapshot: ${field}`)
}

function metricCount(value: unknown, field: string): number {
  return Number(metricDigits(value, field))
}

function roleCount(value: unknown): number {
  const n = typeof value === 'string' && DIGIT_STRING.test(value) ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function parseRoles(metrics: Record<string, unknown>): ParticipantRoles {
  return {
    ecosystem: roleCount(metrics.participants_ecosystem),
    issuer: roleCount(metrics.participants_issuer),
    verifier: roleCount(metrics.participants_verifier),
    holder: roleCount(metrics.participants_holder),
    issuerGrantor: roleCount(metrics.participants_issuer_grantor),
    verifierGrantor: roleCount(metrics.participants_verifier_grantor),
  }
}

export function parseDashboardMetricsResponse(payload: unknown): DashboardData {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid V4 stats snapshot')
  }
  const metrics = payload as Record<string, unknown>
  return {
    ecosystems: metricCount(metrics.active_ecosystems, 'active_ecosystems'),
    schemas: metricCount(metrics.active_schemas, 'active_schemas'),
    participants: metricCount(metrics.participants, 'participants'),
    totalLockedTrustDeposit: metricDigits(metrics.weight, 'weight'),
    issuedCredentials: metricCount(metrics.issued, 'issued'),
    verifiedCredentials: metricCount(metrics.verified, 'verified'),
    roles: parseRoles(metrics),
  }
}

export function useDashboardData() {
  const getURL = VERANA_REST_ENDPOINT_STATS

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorDashboardData, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      if (!getURL) {
        setError(resolveTranslatable({ key: 'error.fetch.metrics' }, translate) ?? 'Missing metrics endpoint URL')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      const res = await fetch(`${getURL}/snapshot?entity_type=GLOBAL`)
      const json: unknown = await res.json()
      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse
        setError(`Error ${code}: ${error}`)
        return
      }
      setDashboardData(parseDashboardMetricsResponse(json))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMetrics()
  }, [fetchMetrics])

  return {
    dashboardData,
    loading,
    errorDashboardData,
    refetch: fetchMetrics,
  }
}
