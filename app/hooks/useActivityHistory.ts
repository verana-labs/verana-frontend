'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type ActivityRow, fetchActivityHistory } from '@/lib/activity-history'
import { logger } from '@/lib/logger'

interface ActivityHistoryState {
  rows: ActivityRow[]
  partial: boolean
  loading: boolean
  failed: boolean
}

export function useActivityHistory(url: string | undefined) {
  const [state, setState] = useState<ActivityHistoryState>({ rows: [], partial: false, loading: true, failed: false })
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    if (!url) {
      setState({ rows: [], partial: false, loading: false, failed: true })
      return
    }
    setState((previous) => ({ ...previous, loading: true }))
    try {
      const { rows, partial } = await fetchActivityHistory(url)
      if (requestRef.current === requestId) setState({ rows, partial, loading: false, failed: false })
    } catch (cause) {
      logger.error('activity history', cause)
      if (requestRef.current === requestId) setState({ rows: [], partial: false, loading: false, failed: true })
    }
  }, [url])

  useEffect(() => {
    setState({ rows: [], partial: false, loading: true, failed: false })
    void load()
  }, [load])

  return { ...state, refetch: load }
}
