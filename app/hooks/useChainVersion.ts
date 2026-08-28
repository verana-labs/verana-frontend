'use client'

import { useEffect } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { logger } from '@/lib/logger'
import { useComponentsVersion } from '@/providers/components-version-provider'

export function useChainVersion() {
  const veranaChain = useVeranaChain()
  const rpcEndpoint = veranaChain?.apis?.rpc?.[0]?.address
  const { setState } = useComponentsVersion()

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    const fetchVersion = async () => {
      try {
        if (!rpcEndpoint) return

        const response = await fetch(`${rpcEndpoint.replace(/\/$/, '')}/abci_info`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Failed to load version: ${response.status}`)
        const data = await response.json()
        const remoteVersion = data?.result?.response?.version ?? null
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            ledger: {
              ...prev.ledger,
              version: remoteVersion,
            },
          }))
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }

        if (!ignore) {
          setState((prev) => ({
            ...prev,
            ledger: {
              ...prev.ledger,
              version: null,
            },
          }))
        }

        logger.error('Failed to load chain version', err)
      }
    }

    fetchVersion()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [rpcEndpoint, setState])
}
