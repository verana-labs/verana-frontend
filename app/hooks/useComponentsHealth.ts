'use client'

import { useEffect } from 'react'
import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { parseIndexerStatus, parseRpcStatus } from '@/lib/component-health'
import { logger } from '@/lib/logger'
import { useComponentsVersion } from '@/providers/components-version-provider'

const POLL_MS = 60_000

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  return response.json()
}

export function useComponentsHealth() {
  const veranaChain = useVeranaChain()
  const rpcEndpoint = veranaChain?.apis?.rpc?.[0]?.address
  const { setState } = useComponentsVersion()

  useEffect(() => {
    const controller = new AbortController()

    const check = async () => {
      if (rpcEndpoint) {
        try {
          const health = parseRpcStatus(await readJson(`${rpcEndpoint.replace(/\/$/, '')}/status`, controller.signal))
          setState((prev) => ({ ...prev, ledger: { ...prev.ledger, health } }))
        } catch (error) {
          if (controller.signal.aborted) return
          logger.error('Failed to load chain status', error)
          setState((prev) => ({ ...prev, ledger: { ...prev.ledger, health: 'unreachable' } }))
        }
      }
      if (VERANA_REST_ENDPOINT_INDEXER) {
        try {
          const health = parseIndexerStatus(await readJson(`${VERANA_REST_ENDPOINT_INDEXER}/status`, controller.signal))
          setState((prev) => ({ ...prev, indexer: { ...prev.indexer, health } }))
        } catch (error) {
          if (controller.signal.aborted) return
          logger.error('Failed to load indexer status', error)
          setState((prev) => ({
            ...prev,
            indexer: { ...prev.indexer, health: { state: 'unreachable', reason: null } },
          }))
        }
      }
    }

    void check()
    const timer = window.setInterval(() => void check(), POLL_MS)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [rpcEndpoint, setState])
}
