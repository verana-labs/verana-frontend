'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { indexerValidators } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'

const { record, nullableString } = indexerValidators('indexer health')

export interface IndexerHealth {
  running: boolean
  crawling: boolean
  stoppedAt: string | null
  stoppedReason: string | null
}

export function parseIndexerStatus(payload: unknown): IndexerHealth {
  const status = record(payload, 'status')
  if (typeof status.is_running !== 'boolean' || typeof status.is_crawling !== 'boolean') {
    throw new Error('Invalid indexer health response: status.is_crawling')
  }
  return {
    running: status.is_running,
    crawling: status.is_crawling,
    stoppedAt: nullableString(status.stopped_at ?? null, 'status.stopped_at'),
    stoppedReason: nullableString(status.stopped_reason ?? null, 'status.stopped_reason'),
  }
}

export async function fetchIndexerHealth(): Promise<IndexerHealth | null> {
  if (!VERANA_REST_ENDPOINT_INDEXER) return null
  try {
    const response = await fetch(`${VERANA_REST_ENDPOINT_INDEXER}/status`)
    if (!response.ok) throw new Error(`Indexer responded ${response.status} for status`)
    return parseIndexerStatus(await response.json())
  } catch (cause) {
    logger.error('indexer status', cause)
    return null
  }
}

export function useIndexerHealth() {
  const [health, setHealth] = useState<IndexerHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const requestRef = useRef(0)

  const refetch = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    const next = await fetchIndexerHealth()
    if (requestRef.current !== requestId) return
    setHealth(next)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { health, loading, refetch }
}
