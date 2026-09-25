import { VERANA_WEBSOCKET } from '@/config/env'
import {
  INDEXER_EVENTS_PAGE_LIMIT,
  type IndexerEvent,
  type IndexerSocketMessage,
  indexerEventKey,
  indexerEventsUrl,
  parseIndexerEventsPage,
  parseIndexerSocketMessage,
} from '@/lib/indexer-event'
import { logger } from '@/lib/logger'

const DEFAULT_BLOCK_INTERVAL_MS = 6000
const RECONNECT_CEILING_MS = 10_000

export type IndexerSocketLike = {
  send: (data: string) => void
  close: () => void
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onerror: ((event: unknown) => void) | null
  onclose: ((event: unknown) => void) | null
}

export type IndexerSubscriptionsOptions = {
  onProcessedBlock: (height: number, blockTime: string | null) => void
  onEvents: (corporationId: number, events: IndexerEvent[]) => void
  onConnectionChange?: (connected: boolean) => void
  url?: string
  connect?: (url: string) => IndexerSocketLike
  fetchEvents?: (corporationId: number, afterBlockHeight: number) => Promise<IndexerEvent[]>
  random?: () => number
}

export type IndexerSubscriptions = {
  setCorporations: (corporationIds: number[]) => void
  getBlockIntervalMs: () => number
  close: () => void
}

type BlockEnvelope = Extract<IndexerSocketMessage, { type: 'block' }>

type Stream = {
  corporationId: number | null
  socket: IndexerSocketLike | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  livenessTimer: ReturnType<typeof setTimeout> | null
  attempts: number
  generation: number
  open: boolean
  established: boolean
  lastSeenBlock: number
  pendingHeight: number
  catchUpHighWater: number
  buffer: BlockEnvelope[]
  appliedKeys: Set<string>
  closed: boolean
}

async function fetchIndexerEvents(corporationId: number, afterBlockHeight: number): Promise<IndexerEvent[]> {
  const url = indexerEventsUrl(corporationId, afterBlockHeight)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  const events = parseIndexerEventsPage(await response.json())
  if (!events) throw new Error('Invalid indexer events response')
  return events
}

export function createIndexerSubscriptions(options: IndexerSubscriptionsOptions): IndexerSubscriptions {
  const url = options.url ?? VERANA_WEBSOCKET
  const connect = options.connect ?? ((target: string) => new WebSocket(target) as unknown as IndexerSocketLike)
  const fetchEvents = options.fetchEvents ?? fetchIndexerEvents
  const random = options.random ?? Math.random
  const streams = new Map<number | null, Stream>()
  let blockIntervalMs = DEFAULT_BLOCK_INTERVAL_MS
  let connected = false

  function notifyConnection(): void {
    const open = [...streams.values()].some((stream) => stream.open)
    if (open === connected) return
    connected = open
    options.onConnectionChange?.(open)
  }

  function clearTimers(stream: Stream): void {
    if (stream.reconnectTimer) clearTimeout(stream.reconnectTimer)
    if (stream.livenessTimer) clearTimeout(stream.livenessTimer)
    stream.reconnectTimer = null
    stream.livenessTimer = null
  }

  function teardownSocket(stream: Stream): void {
    const socket = stream.socket
    if (!socket) return
    stream.socket = null
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    socket.close()
  }

  function armLiveness(stream: Stream): void {
    if (stream.corporationId === null || stream.closed) return
    if (stream.livenessTimer) clearTimeout(stream.livenessTimer)
    // Block envelopes are the heartbeat, so a silent stream is a broken stream, per [VFE-DATA-WS-2].
    stream.livenessTimer = setTimeout(() => recover(stream, 'liveness'), 2 * blockIntervalMs)
  }

  function scheduleReconnect(stream: Stream): void {
    const delay = Math.min(1000 * 2 ** stream.attempts, RECONNECT_CEILING_MS)
    stream.attempts += 1
    // Jitter spreads the reconnection of the streams that one network loss broke together.
    stream.reconnectTimer = setTimeout(() => openStream(stream), delay * (0.5 + 0.5 * random()))
  }

  function recover(stream: Stream, reason: string): void {
    if (stream.closed) return
    logger.warn('Indexer subscription recovery', { corporationId: stream.corporationId, reason })
    stream.generation += 1
    stream.established = false
    stream.open = false
    stream.buffer = []
    clearTimers(stream)
    teardownSocket(stream)
    notifyConnection()
    scheduleReconnect(stream)
  }

  function applyEvents(stream: Stream, events: IndexerEvent[]): void {
    if (stream.corporationId === null || events.length === 0) return
    const fresh = events.filter((event) => !stream.appliedKeys.has(indexerEventKey(event)))
    for (const event of fresh) stream.appliedKeys.add(indexerEventKey(event))
    if (fresh.length > 0) options.onEvents(stream.corporationId, fresh)
  }

  function applyEnvelope(stream: Stream, envelope: BlockEnvelope): void {
    stream.lastSeenBlock = Math.max(stream.lastSeenBlock, envelope.height)
    options.onProcessedBlock(envelope.height, envelope.blockTime)
    applyEvents(stream, envelope.events)
    if (envelope.height > stream.catchUpHighWater) stream.appliedKeys.clear()
    armLiveness(stream)
  }

  function establish(stream: Stream): void {
    stream.established = true
    const buffered = stream.buffer
    stream.buffer = []
    for (const envelope of buffered) {
      if (envelope.height <= stream.lastSeenBlock) {
        applyEvents(stream, envelope.events)
        continue
      }
      if (envelope.height > stream.lastSeenBlock + 1) {
        recover(stream, 'gap')
        return
      }
      applyEnvelope(stream, envelope)
    }
    armLiveness(stream)
  }

  async function drainCatchUp(stream: Stream): Promise<void> {
    const corporationId = stream.corporationId
    if (corporationId === null) return
    const generation = stream.generation
    const collected: IndexerEvent[] = []
    // Without a known height the acknowledgement is the floor, so no replay covers the whole chain.
    let after = stream.lastSeenBlock > 0 ? stream.lastSeenBlock : stream.pendingHeight
    try {
      for (;;) {
        const page = await fetchEvents(corporationId, after)
        if (generation !== stream.generation) return
        if (page.length === 0) break
        collected.push(...page)
        const highest = page.reduce((maximum, event) => Math.max(maximum, event.blockHeight), after)
        if (page.length < INDEXER_EVENTS_PAGE_LIMIT || highest <= after) break
        after = highest
      }
    } catch (error) {
      logger.error('Indexer catch-up failed', { corporationId, error })
      recover(stream, 'catch-up')
      return
    }
    const highest = collected.reduce((maximum, event) => Math.max(maximum, event.blockHeight), 0)
    stream.catchUpHighWater = Math.max(stream.pendingHeight, highest)
    applyEvents(stream, collected)
    stream.lastSeenBlock = Math.max(stream.lastSeenBlock, stream.pendingHeight, highest)
    establish(stream)
  }

  function handleMessage(stream: Stream, raw: unknown): void {
    let message: IndexerSocketMessage | null = null
    try {
      message = parseIndexerSocketMessage(typeof raw === 'string' ? JSON.parse(raw) : raw)
    } catch (error) {
      logger.error('Failed to parse indexer websocket event:', error)
      return
    }
    if (!message || stream.closed) return

    if (message.type === 'ready') {
      if (message.blockIntervalMs) blockIntervalMs = message.blockIntervalMs
      stream.attempts = 0
      // A first stream starts from the height of the connection, so the catch-up stays short.
      if (stream.lastSeenBlock === 0) stream.lastSeenBlock = message.processedHeight
      options.onProcessedBlock(message.processedHeight, message.blockTime)
      return
    }

    if (message.type === 'subscribed') {
      stream.pendingHeight = message.processedHeight
      options.onProcessedBlock(message.processedHeight, message.blockTime)
      armLiveness(stream)
      void drainCatchUp(stream)
      return
    }

    if (!stream.established) {
      // Buffer every envelope until the catch-up ends, per [IDX-INDEXER-SUB-1].
      stream.buffer.push(message)
      options.onProcessedBlock(message.height, message.blockTime)
      armLiveness(stream)
      return
    }

    if (message.height > stream.lastSeenBlock + 1) {
      options.onProcessedBlock(message.height, message.blockTime)
      recover(stream, 'gap')
      return
    }

    applyEnvelope(stream, message)
  }

  function openStream(stream: Stream): void {
    if (stream.closed || !url) return
    stream.reconnectTimer = null
    const socket = connect(url)
    stream.socket = socket
    socket.onopen = () => {
      if (stream.closed) return
      stream.open = true
      if (stream.corporationId !== null) {
        socket.send(JSON.stringify({ action: 'subscribe', corporationId: stream.corporationId }))
        // The acknowledgement must arrive inside the liveness window, per [IDX-INDEXER-SUB-1].
        armLiveness(stream)
      }
      notifyConnection()
    }
    socket.onmessage = (event) => handleMessage(stream, event.data)
    socket.onerror = (error) => logger.error('Indexer websocket error:', error)
    socket.onclose = () => recover(stream, 'closed')
  }

  function createStream(corporationId: number | null): void {
    const stream: Stream = {
      corporationId,
      socket: null,
      reconnectTimer: null,
      livenessTimer: null,
      attempts: 0,
      generation: 0,
      open: false,
      established: false,
      lastSeenBlock: 0,
      pendingHeight: 0,
      catchUpHighWater: 0,
      buffer: [],
      appliedKeys: new Set<string>(),
      closed: false,
    }
    streams.set(corporationId, stream)
    openStream(stream)
  }

  function closeStream(key: number | null): void {
    const stream = streams.get(key)
    if (!stream) return
    stream.closed = true
    stream.generation += 1
    stream.open = false
    clearTimers(stream)
    teardownSocket(stream)
    streams.delete(key)
  }

  function setCorporations(corporationIds: number[]): void {
    if (!url) {
      logger.error('NEXT_PUBLIC_VERANA_WEBSOCKET is not defined')
      return
    }
    const wanted = new Set(corporationIds.filter((id) => Number.isSafeInteger(id) && id > 0))
    for (const key of [...streams.keys()]) {
      if (key !== null && !wanted.has(key)) closeStream(key)
    }
    if (wanted.size === 0) {
      // Guest mode holds no subscription, per [VFE-DATA-WS-1]. The socket stays open because its
      // `ready` message carries the indexer height that [VFE-DATA-WS-4] needs.
      if (!streams.has(null)) createStream(null)
    } else {
      closeStream(null)
      for (const id of wanted) if (!streams.has(id)) createStream(id)
    }
    notifyConnection()
  }

  return {
    setCorporations,
    getBlockIntervalMs: () => blockIntervalMs,
    close: () => {
      for (const key of [...streams.keys()]) closeStream(key)
      notifyConnection()
    },
  }
}
