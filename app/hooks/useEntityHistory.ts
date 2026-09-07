'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA, VERANA_REST_ENDPOINT_ECOSYSTEM } from '@/config/env'
import { type ActivityRow, parseHistory } from '@/hooks/useCorporationDetails'
import { logger } from '@/lib/logger'

export type HistoryEntity = 'ecosystem' | 'credential-schema'

const HISTORY_PAGE_SIZE = 64

export function historyUrl(entity: HistoryEntity, id: string): string | undefined {
  const endpoint = entity === 'ecosystem' ? VERANA_REST_ENDPOINT_ECOSYSTEM : VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA
  return endpoint ? `${endpoint}/history/${id}?limit=${HISTORY_PAGE_SIZE}` : undefined
}

export async function fetchEntityHistory(entity: HistoryEntity, id: string): Promise<ActivityRow[]> {
  const url = historyUrl(entity, id)
  if (!url) return []
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Unable to fetch the history: ${response.status}`)
    return parseHistory(await response.json())
  } catch (cause) {
    logger.error(`${entity} ${id} history`, cause)
    return []
  }
}

export function useEntityHistory(entity: HistoryEntity, id: string) {
  const [history, setHistory] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(false)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    if (!id) {
      setHistory([])
      setLoading(false)
      return
    }
    setLoading(true)
    const rows = await fetchEntityHistory(entity, id)
    if (requestRef.current !== requestId) return
    setHistory(rows)
    setLoading(false)
  }, [entity, id])

  useEffect(() => {
    void load()
  }, [load])

  return { history, loading, refetch: load }
}
