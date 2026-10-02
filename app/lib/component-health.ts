export type ChainHealth = 'synced' | 'syncing' | 'unreachable'

export type IndexerHealth = {
  state: 'crawling' | 'stalled' | 'down' | 'unreachable'
  reason: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function parseRpcStatus(payload: unknown): ChainHealth {
  const catchingUp = asRecord(asRecord(asRecord(payload)?.result)?.sync_info)?.catching_up
  if (typeof catchingUp !== 'boolean') throw new Error('Invalid RPC status response: result.sync_info.catching_up')
  return catchingUp ? 'syncing' : 'synced'
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
