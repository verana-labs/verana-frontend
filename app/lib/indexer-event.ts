export type IndexerEntityEvent = {
  eventType: string
  module: string
  did: string | null
  relatedDids: string[]
  corporationId: number | null
  relatedCorporationIds: number[]
}

export type IndexerBlockEvent = {
  height: number
  timestamp: string | null
  events: IndexerEntityEvent[]
}

function integerOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null
}

function parseEntityEvent(value: unknown): IndexerEntityEvent | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const event = value as Record<string, unknown>
  const payload =
    typeof event.payload === 'object' && event.payload !== null ? (event.payload as Record<string, unknown>) : {}
  if (typeof payload.module !== 'string') return null
  const related = Array.isArray(payload.related_corporation_ids) ? payload.related_corporation_ids : []
  return {
    eventType: typeof event.event_type === 'string' ? event.event_type : '',
    module: payload.module,
    did: typeof event.did === 'string' ? event.did : null,
    relatedDids: Array.isArray(payload.related_dids)
      ? payload.related_dids.filter((did): did is string => typeof did === 'string')
      : [],
    corporationId: integerOrNull(payload.corporation_id),
    relatedCorporationIds: related.map(integerOrNull).filter((id): id is number => id !== null),
  }
}

export function parseIndexerBlockEvent(value: unknown): IndexerBlockEvent | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const message = value as Record<string, unknown>
  if (message.type !== 'ready' && message.type !== 'block') return null
  if (typeof message.block !== 'number' || !Number.isSafeInteger(message.block) || message.block < 0) return null
  if (message.blockTime !== undefined && typeof message.blockTime !== 'string') return null
  const events = Array.isArray(message.events) ? message.events : []
  return {
    height: message.block,
    timestamp: message.blockTime ?? null,
    events: events.map(parseEntityEvent).filter((event): event is IndexerEntityEvent => event !== null),
  }
}

export function parseIndexerBlockHeight(value: unknown): IndexerBlockEvent | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const payload = value as Record<string, unknown>
  if (typeof payload.height !== 'number' || !Number.isSafeInteger(payload.height) || payload.height < 0) return null
  if (payload.timestamp !== undefined && typeof payload.timestamp !== 'string') return null
  return { height: payload.height, timestamp: payload.timestamp ?? null, events: [] }
}

// Per [VFE-DATA-WS-3] only events of the acting Corporation drive a refresh. The wildcard stream carries
// every Corporation, so the match uses the payload corporation ids and falls back to the DIDs the view knows.
export function concernsCorporation(event: IndexerEntityEvent, corporationId: number, knownDids: Set<string>): boolean {
  if (event.corporationId !== null || event.relatedCorporationIds.length > 0) {
    return event.corporationId === corporationId || event.relatedCorporationIds.includes(corporationId)
  }
  if (event.did !== null && knownDids.has(event.did)) return true
  return event.relatedDids.some((did) => knownDids.has(did))
}
