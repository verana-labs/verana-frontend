import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { indexerValidators } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'

export type IndexerBlockEvent = {
  height: number
  timestamp: string | null
}

export type IndexerEvent = {
  eventType: string
  module: string
  did: string | null
  blockHeight: number
  txHash: string
  messageIndex: number
  sender: string
  grantee: string | null
  corporationId: number | null
}

export type IndexerSocketMessage =
  | { type: 'ready'; processedHeight: number; blockTime: string | null; blockIntervalMs: number | null }
  | { type: 'subscribed'; processedHeight: number; blockTime: string | null }
  | { type: 'block'; height: number; blockTime: string | null; events: IndexerEvent[] }

export type IndexerRefreshTarget = 'attention' | 'participants' | 'ecosystems' | 'credentialSchemas' | 'dashboard'

export const INDEXER_EVENTS_PAGE_LIMIT = 500

const { record, string, integer, nullableString, optionalString } = indexerValidators('indexer event')

function parsed<T>(build: () => T): T | null {
  try {
    return build()
  } catch (error) {
    logger.warn('Discarded an indexer payload', error)
    return null
  }
}

function parseEvent(value: unknown, path: string): IndexerEvent {
  const event = record(value, path)
  const payload = record(event.payload, `${path}.payload`)
  return {
    eventType: string(event.event_type, `${path}.event_type`),
    module: string(payload.module, `${path}.payload.module`),
    did: nullableString(event.did, `${path}.did`),
    blockHeight: integer(event.block_height, `${path}.block_height`),
    txHash: string(event.tx_hash, `${path}.tx_hash`),
    messageIndex: integer(payload.message_index, `${path}.payload.message_index`),
    sender: string(payload.sender, `${path}.payload.sender`),
    grantee: optionalString(payload.grantee, `${path}.payload.grantee`) ?? null,
    corporationId:
      payload.corporation_id === undefined || payload.corporation_id === null
        ? null
        : integer(payload.corporation_id, `${path}.payload.corporation_id`),
  }
}

function parseEventList(value: unknown, path: string): IndexerEvent[] {
  if (!Array.isArray(value)) throw new Error(`Invalid indexer event response: missing ${path} envelope`)
  // One unexpected entry must not discard the rest of the batch.
  const events: IndexerEvent[] = []
  value.forEach((entry, index) => {
    const event = parsed(() => parseEvent(entry, `${path}[${index}]`))
    if (event) events.push(event)
  })
  return events
}

export function parseIndexerSocketMessage(value: unknown): IndexerSocketMessage | null {
  return parsed(() => {
    const message = record(value, 'message')
    const type = string(message.type, 'message.type')
    // The contract asks the client to ignore the message types it does not know.
    if (type !== 'ready' && type !== 'subscribed' && type !== 'block') return null
    const blockTime = optionalString(message.blockTime, 'message.blockTime') ?? null
    const block = integer(message.block, 'message.block')
    // A heartbeat envelope can leave `events` out, and it means the same as an empty list.
    if (type === 'block')
      return { type, height: block, blockTime, events: parseEventList(message.events ?? [], 'events') }
    // The server counts `block` as the next block it will deliver, so the processed height is one less.
    const processedHeight = Math.max(0, block - 1)
    if (type === 'subscribed') return { type, processedHeight, blockTime }
    const interval =
      message.blockIntervalMs === undefined ? null : integer(message.blockIntervalMs, 'message.blockIntervalMs')
    return { type, processedHeight, blockTime, blockIntervalMs: interval && interval > 0 ? interval : null }
  })
}

export function parseIndexerBlockHeight(value: unknown): IndexerBlockEvent | null {
  return parsed(() => {
    const payload = record(value, 'block height')
    return {
      height: integer(payload.height, 'block height.height'),
      timestamp: optionalString(payload.timestamp, 'block height.timestamp') ?? null,
    }
  })
}

export function parseIndexerEventsPage(value: unknown): IndexerEvent[] | null {
  return parsed(() => parseEventList(record(value, 'events response').events, 'events'))
}

export function indexerEventsUrl(corporationId: number, afterBlockHeight: number): string {
  if (!VERANA_REST_ENDPOINT_INDEXER) throw new Error('Missing V4 indexer endpoint')
  return `${VERANA_REST_ENDPOINT_INDEXER}/events?corporation_id=${corporationId}&after_block_height=${afterBlockHeight}&limit=${INDEXER_EVENTS_PAGE_LIMIT}`
}

export function indexerEventKey(event: IndexerEvent): string {
  return `${event.txHash}#${event.messageIndex}`
}

export function refreshTargets(event: IndexerEvent): IndexerRefreshTarget[] {
  switch (event.module) {
    case 'participant':
      return ['attention', 'participants']
    case 'delegation':
    case 'group':
      return ['attention']
    case 'ecosystem':
      return ['ecosystems']
    case 'credential-schema':
      return ['credentialSchemas']
    case 'corporation':
      return ['dashboard']
    default:
      return []
  }
}

export function triggersDiscovery(event: IndexerEvent, account: string): boolean {
  if (event.module === 'delegation') {
    return (
      (event.eventType === 'GrantOperatorAuthorization' || event.eventType === 'RevokeOperatorAuthorization') &&
      (event.grantee === account || event.sender === account)
    )
  }
  return event.module === 'group' && event.eventType === 'UpdateGroupMembers'
}
