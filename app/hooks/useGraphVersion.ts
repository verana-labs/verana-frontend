'use client'

import { useEffect } from 'react'
import { VERANA_GRAPH_URL } from '@/config/env'
import { logger } from '@/lib/logger'
import { useComponentsVersion } from '@/providers/components-version-provider'

export function parseGraphVersionResponse(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid graph version response: response')
  }
  const info = (payload as Record<string, unknown>).info
  const version = typeof info === 'object' && info !== null ? (info as Record<string, unknown>).version : undefined
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('Invalid graph version response: info.version')
  }
  return version.startsWith('v') ? version : `v${version}`
}

export function useGraphVersion() {
  const { setState } = useComponentsVersion()

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    const fetchVersion = async () => {
      try {
        if (!VERANA_GRAPH_URL) return

        const response = await fetch(`${VERANA_GRAPH_URL}/docs/openapi.json`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Failed to load graph version: ${response.status}`)
        const data: unknown = await response.json()
        const version = parseGraphVersionResponse(data)
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            graph: {
              ...prev.graph,
              version,
            },
          }))
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            graph: {
              ...prev.graph,
              version: null,
            },
          }))
        }
        logger.error('Failed to load graph version', err)
      }
    }

    fetchVersion()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [setState])
}
