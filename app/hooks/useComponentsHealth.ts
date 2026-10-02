'use client'

import { useEffect } from 'react'
import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { indexerHealthFromResponse, parseRpcStatus } from '@/lib/component-health'
import { logger } from '@/lib/logger'
import { useComponentsVersion } from '@/providers/components-version-provider'

const POLL_MS = 60_000
const REQUEST_TIMEOUT_MS = 15_000

async function readStatus(url: string, signal: AbortSignal): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    cache: 'no-store',
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

export function useComponentsHealth() {
  const veranaChain = useVeranaChain()
  const rpcEndpoint = veranaChain?.apis?.rpc?.[0]?.address
  const { setState } = useComponentsVersion()

  useEffect(() => {
    const controller = new AbortController()

    const checkChain = async () => {
      if (!rpcEndpoint) return
      try {
        const { status, body } = await readStatus(`${rpcEndpoint.replace(/\/$/, '')}/status`, controller.signal)
        if (status < 200 || status >= 300) throw new Error(`RPC status responded ${status}`)
        const health = parseRpcStatus(body)
        setState((prev) => ({ ...prev, ledger: { ...prev.ledger, health } }))
      } catch (error) {
        if (controller.signal.aborted) return
        logger.error('Failed to load chain status', error)
        setState((prev) => ({ ...prev, ledger: { ...prev.ledger, health: 'unreachable' } }))
      }
    }

    const checkIndexer = async () => {
      if (!VERANA_REST_ENDPOINT_INDEXER) return
      try {
        const { status, body } = await readStatus(`${VERANA_REST_ENDPOINT_INDEXER}/status`, controller.signal)
        const health = indexerHealthFromResponse(status, body)
        setState((prev) => ({ ...prev, indexer: { ...prev.indexer, health } }))
      } catch (error) {
        if (controller.signal.aborted) return
        logger.error('Failed to load indexer status', error)
        setState((prev) => ({ ...prev, indexer: { ...prev.indexer, health: { state: 'unreachable', reason: null } } }))
      }
    }

    const check = () => {
      void checkChain()
      void checkIndexer()
    }

    check()
    const timer = window.setInterval(() => {
      if (!document.hidden) check()
    }, POLL_MS)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [rpcEndpoint, setState])
}
