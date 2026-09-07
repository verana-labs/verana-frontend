export type IndexerBlockEvent = {
  height: number
  timestamp: string | null
}

export function parseIndexerBlockEvent(value: unknown): IndexerBlockEvent | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const message = value as Record<string, unknown>
  if (message.type !== 'ready' && message.type !== 'block') return null
  if (typeof message.block !== 'number' || !Number.isSafeInteger(message.block) || message.block < 0) return null
  if (message.blockTime !== undefined && typeof message.blockTime !== 'string') return null
  return {
    height: message.block,
    timestamp: message.blockTime ?? null,
  }
}
