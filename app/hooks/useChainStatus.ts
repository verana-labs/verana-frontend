'use client'

import { useEffect, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { indexerValidators } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'

const { record, string, nullableString } = indexerValidators('chain status')

export interface ChainStatus {
  network: string
  nodeVersion: string
  latestBlockHeight: number
  latestBlockTime: string | null
  catchingUp: boolean
}

export function parseChainStatus(payload: unknown): ChainStatus {
  const envelope = record(payload, 'response')
  const result = record(envelope.result, 'result')
  const nodeInfo = record(result.node_info, 'result.node_info')
  const syncInfo = record(result.sync_info, 'result.sync_info')
  const height = Number(string(syncInfo.latest_block_height, 'result.sync_info.latest_block_height'))
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new Error('Invalid chain status response: result.sync_info.latest_block_height')
  }
  if (typeof syncInfo.catching_up !== 'boolean') {
    throw new Error('Invalid chain status response: result.sync_info.catching_up')
  }
  return {
    network: string(nodeInfo.network, 'result.node_info.network'),
    nodeVersion: string(nodeInfo.version, 'result.node_info.version'),
    latestBlockHeight: height,
    latestBlockTime: nullableString(syncInfo.latest_block_time ?? null, 'result.sync_info.latest_block_time'),
    catchingUp: syncInfo.catching_up,
  }
}

export async function fetchChainStatus(rpcEndpoint: string): Promise<ChainStatus | null> {
  try {
    const response = await fetch(`${rpcEndpoint.replace(/\/$/, '')}/status`)
    if (!response.ok) throw new Error(`RPC responded ${response.status} for status`)
    return parseChainStatus(await response.json())
  } catch (cause) {
    logger.error('chain status', cause)
    return null
  }
}

export function useChainStatus() {
  const rpcEndpoint = useVeranaChain().apis?.rpc?.[0]?.address
  const [status, setStatus] = useState<ChainStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const requestRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestRef.current
    if (!rpcEndpoint) {
      setStatus(null)
      setLoading(false)
      return
    }
    setLoading(true)
    void fetchChainStatus(rpcEndpoint).then((next) => {
      if (requestRef.current !== requestId) return
      setStatus(next)
      setLoading(false)
    })
  }, [rpcEndpoint])

  return { status, loading }
}
