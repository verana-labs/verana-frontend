'use client'

import { useEffect } from 'react'
import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { logger } from '@/lib/logger'
import { useComponentsVersion } from '@/providers/components-version-provider'

export function parseIndexerVersionResponse(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid indexer version response: response')
  }
  const version = (payload as Record<string, unknown>).app_version
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('Invalid indexer version response: app_version')
  }
  return version
}

export function useIndexerVersion() {
  const { setState } = useComponentsVersion()

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    const fetchVersion = async () => {
      try {
        const indexerEndpoint = VERANA_REST_ENDPOINT_INDEXER
        if (!indexerEndpoint) return

        const response = await fetch(`${indexerEndpoint}/version`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Failed to load indexer version: ${response.status}`)
        const data: unknown = await response.json()
        const version = parseIndexerVersionResponse(data)
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            indexer: {
              ...prev.indexer,
              version,
            },
          }))
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            indexer: {
              ...prev.indexer,
              version: null,
            },
          }))
        }
        logger.error('Failed to load indexer version', err)
      }
    }

    fetchVersion()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [setState])
}
