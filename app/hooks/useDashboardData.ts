'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_STATS } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { DashboardData } from '@/ui/dataview/datasections/dashboard'
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

export function parseDashboardMetricsResponse(payload: unknown): DashboardData {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid V4 stats snapshot')
  }
  const metrics = payload as Record<string, unknown>
  return {
    ecosystems: metricCount(metrics.active_ecosystems, 'active_ecosystems'),
    schemas: metricCount(metrics.active_schemas, 'active_schemas'),
    totalLockedTrustDeposit: metricDigits(metrics.weight, 'weight'),
    issuedCredentials: metricCount(metrics.issued, 'issued'),
    verifiedCredentials: metricCount(metrics.verified, 'verified'),
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
