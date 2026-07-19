'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_METRICS } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { DashboardData } from '@/ui/dataview/datasections/dashboard'
import { resolveTranslatable } from '@/ui/dataview/types'

function metric(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid V4 metrics response: ${field}`)
  }
  return value
}

export function parseDashboardMetricsResponse(payload: unknown): DashboardData {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid V4 metrics response')
  }
  const metrics = payload as Record<string, unknown>
  return {
    ecosystems: metric(metrics.active_ecosystems, 'active_ecosystems'),
    schemas: metric(metrics.active_schemas, 'active_schemas'),
    totalLockedTrustDeposit: metric(metrics.weight, 'weight'),
    issuedCredentials: metric(metrics.issued, 'issued'),
    verifiedCredentials: metric(metrics.verified, 'verified'),
  }
}

export function useDashboardData() {
  const getURL = VERANA_REST_ENDPOINT_METRICS

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
      const res = await fetch(`${getURL}/all`)
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
