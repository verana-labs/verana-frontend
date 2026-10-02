export type ChainHealth = 'synced' | 'syncing' | 'stalled' | 'unreachable'

export type IndexerHealth = {
  state: 'crawling' | 'stalled' | 'down' | 'unreachable'
  reason: string | null
}

const CHAIN_STALL_MS = 120_000

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function parseRpcStatus(payload: unknown, now = Date.now()): ChainHealth {
  const syncInfo = asRecord(asRecord(asRecord(payload)?.result)?.sync_info)
  if (typeof syncInfo?.catching_up !== 'boolean') {
    throw new Error('Invalid RPC status response: result.sync_info.catching_up')
  }
  if (syncInfo.catching_up) return 'syncing'
  const blockTime = typeof syncInfo.latest_block_time === 'string' ? Date.parse(syncInfo.latest_block_time) : Number.NaN
  if (!Number.isFinite(blockTime)) throw new Error('Invalid RPC status response: result.sync_info.latest_block_time')
  return now - blockTime > CHAIN_STALL_MS ? 'stalled' : 'synced'
}

export function parseIndexerStatus(payload: unknown): IndexerHealth {
  const status = asRecord(payload)
  if (!status || typeof status.is_running !== 'boolean' || typeof status.is_crawling !== 'boolean') {
    throw new Error('Invalid indexer status response: is_running, is_crawling')
  }
  const reason = typeof status.stopped_reason === 'string' && status.stopped_reason ? status.stopped_reason : null
  if (!status.is_running) return { state: 'down', reason }
  if (!status.is_crawling) return { state: 'stalled', reason }
  return { state: 'crawling', reason: null }
}

export function indexerHealthFromResponse(status: number, payload: unknown): IndexerHealth {
  if (status === 503) {
    const error = asRecord(payload)?.error
    return { state: 'down', reason: typeof error === 'string' && error ? error.trim() : null }
  }
  if (status < 200 || status >= 300) throw new Error(`Indexer status responded ${status}`)
  return parseIndexerStatus(payload)
}
