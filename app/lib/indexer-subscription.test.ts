import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_INDEXER: 'https://indexer.example/v4/indexer',
  VERANA_WEBSOCKET: 'wss://indexer.example/v4/indexer/subscribe',
}))

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import type { IndexerEvent } from '@/lib/indexer-event'
import { createIndexerSubscriptions, type IndexerSocketLike } from '@/lib/indexer-subscription'

const BLOCK_INTERVAL_MS = 6000
const BLOCK_TIME = '2026-07-18T07:00:00Z'

type FakeSocket = IndexerSocketLike & {
  sent: unknown[]
  closed: boolean
  accept: () => void
  emit: (message: unknown) => void
  drop: () => void
}

function createFakeSocket(): FakeSocket {
  const socket: FakeSocket = {
    sent: [],
    closed: false,
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    send: (data: string) => {
      socket.sent.push(JSON.parse(data))
    },
    close: () => {
      socket.closed = true
    },
    accept: () => socket.onopen?.({}),
    emit: (message: unknown) => socket.onmessage?.({ data: JSON.stringify(message) }),
    drop: () => socket.onclose?.({}),
  }
  return socket
}

function rawEvent(txHash: string, blockHeight: number, messageIndex = 0) {
  return {
    type: 'indexer-event',
    event_type: 'StartParticipantOP',
    did: null,
    block_height: blockHeight,
    tx_hash: txHash,
    timestamp: BLOCK_TIME,
    payload: {
      module: 'participant',
      action: 'start_participant_op',
      message_type: 'MsgStartParticipantOP',
      tx_index: 0,
      message_index: messageIndex,
      sender: 'verana1sender',
      related_dids: [],
    },
  }
}

function storedEvent(txHash: string, blockHeight: number, messageIndex = 0): IndexerEvent {
  return {
    eventType: 'StartParticipantOP',
    module: 'participant',
    did: null,
    blockHeight,
    txHash,
    messageIndex,
    sender: 'verana1sender',
    grantee: null,
    corporationId: null,
  }
}

function createHarness(random: () => number = () => 0) {
  const sockets: FakeSocket[] = []
  const batches: { corporationId: number; txHashes: string[] }[] = []
  const heights: number[] = []
  const fetchEvents = vi.fn<(corporationId: number, afterBlockHeight: number) => Promise<IndexerEvent[]>>()
  fetchEvents.mockResolvedValue([])
  const subscriptions = createIndexerSubscriptions({
    url: 'wss://indexer.example/v4/indexer/subscribe',
    connect: () => {
      const socket = createFakeSocket()
      sockets.push(socket)
      return socket
    },
    fetchEvents,
    random,
    onProcessedBlock: (height) => heights.push(height),
    onEvents: (corporationId, events) => batches.push({ corporationId, txHashes: events.map((event) => event.txHash) }),
  })
  return { sockets, batches, heights, fetchEvents, subscriptions }
}

const flush = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the subscription handshake', () => {
  it('buffers the envelopes until the catch-up ends and then applies them in order', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const socket = harness.sockets[0]

    socket.accept()
    expect(socket.sent).toEqual([{ action: 'subscribe', corporationId: 7 }])

    socket.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    socket.emit({ type: 'block', block: 101, blockTime: BLOCK_TIME, events: [rawEvent('LIVE', 101)] })
    expect(harness.batches).toEqual([])

    harness.fetchEvents.mockResolvedValueOnce([storedEvent('PAST', 100)])
    socket.emit({ type: 'subscribed', block: 101, blockTime: BLOCK_TIME })
    await flush()

    expect(harness.fetchEvents).toHaveBeenCalledWith(7, 100)
    expect(harness.batches).toEqual([
      { corporationId: 7, txHashes: ['PAST'] },
      { corporationId: 7, txHashes: ['LIVE'] },
    ])
  })

  it('reads the processed height from ready and subscribed, and its own height from an envelope', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const socket = harness.sockets[0]

    socket.accept()
    socket.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    socket.emit({ type: 'subscribed', block: 101, blockTime: BLOCK_TIME })
    await flush()
    socket.emit({ type: 'block', block: 101, blockTime: BLOCK_TIME, events: [] })

    expect(harness.heights).toEqual([100, 100, 101])
  })
})

describe('the liveness timeout', () => {
  it('reconnects when the acknowledgement does not arrive inside two block intervals', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const socket = harness.sockets[0]
    socket.accept()
    socket.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })

    await vi.advanceTimersByTimeAsync(2 * BLOCK_INTERVAL_MS - 1)
    expect(socket.closed).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(socket.closed).toBe(true)

    await vi.advanceTimersByTimeAsync(500)
    expect(harness.sockets).toHaveLength(2)
  })

  it('reconnects when the block envelopes stop', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const socket = harness.sockets[0]
    socket.accept()
    socket.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    socket.emit({ type: 'subscribed', block: 101, blockTime: BLOCK_TIME })
    await flush()
    socket.emit({ type: 'block', block: 101, blockTime: BLOCK_TIME, events: [] })

    await vi.advanceTimersByTimeAsync(2 * BLOCK_INTERVAL_MS - 1)
    expect(socket.closed).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(socket.closed).toBe(true)
  })
})

describe('the recovery of a gap', () => {
  it('replays the hole from the last applied block and applies every event once', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const first = harness.sockets[0]
    first.accept()
    first.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    first.emit({ type: 'subscribed', block: 101, blockTime: BLOCK_TIME })
    await flush()
    first.emit({ type: 'block', block: 101, blockTime: BLOCK_TIME, events: [rawEvent('A', 101)] })

    first.emit({ type: 'block', block: 103, blockTime: BLOCK_TIME, events: [rawEvent('C', 103)] })
    expect(first.closed).toBe(true)
    // The height still moves, because the indexer did process that block, per [VFE-DATA-WS-4].
    expect(harness.heights.at(-1)).toBe(103)

    harness.fetchEvents.mockResolvedValueOnce([storedEvent('B', 102), storedEvent('C', 103)])
    await vi.advanceTimersByTimeAsync(500)
    const second = harness.sockets[1]
    second.accept()
    second.emit({ type: 'ready', block: 104, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    second.emit({ type: 'subscribed', block: 104, blockTime: BLOCK_TIME })
    await flush()

    expect(harness.fetchEvents).toHaveBeenLastCalledWith(7, 101)
    expect(harness.batches.flatMap((batch) => batch.txHashes)).toEqual(['A', 'B', 'C'])
  })

  it('applies no event twice when the catch-up and the buffer overlap', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const socket = harness.sockets[0]
    socket.accept()
    socket.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    socket.emit({ type: 'block', block: 101, blockTime: BLOCK_TIME, events: [rawEvent('A', 101)] })
    socket.emit({ type: 'block', block: 102, blockTime: BLOCK_TIME, events: [rawEvent('B', 102)] })

    harness.fetchEvents.mockResolvedValueOnce([storedEvent('A', 101), storedEvent('B', 102)])
    socket.emit({ type: 'subscribed', block: 101, blockTime: BLOCK_TIME })
    await flush()

    expect(harness.batches.flatMap((batch) => batch.txHashes)).toEqual(['A', 'B'])
  })

  it('keeps the stream alive when one event of a batch is malformed', async () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    const socket = harness.sockets[0]
    socket.accept()
    socket.emit({ type: 'ready', block: 101, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    socket.emit({ type: 'subscribed', block: 101, blockTime: BLOCK_TIME })
    await flush()

    const malformed = { ...rawEvent('BAD', 101), payload: { ...rawEvent('BAD', 101).payload, module: undefined } }
    socket.emit({ type: 'block', block: 101, blockTime: BLOCK_TIME, events: [rawEvent('A', 101), malformed] })
    socket.emit({ type: 'block', block: 102, blockTime: BLOCK_TIME, events: [rawEvent('D', 102)] })

    expect(socket.closed).toBe(false)
    expect(harness.batches.flatMap((batch) => batch.txHashes)).toEqual(['A', 'D'])
  })
})

describe('the reconnection backoff', () => {
  it.each([
    [() => 0, 500],
    [() => 1, 1000],
  ])('waits for the jittered delay before it connects again', async (random, delay) => {
    const harness = createHarness(random)
    harness.subscriptions.setCorporations([7])
    harness.sockets[0].accept()
    harness.sockets[0].drop()

    await vi.advanceTimersByTimeAsync(delay - 1)
    expect(harness.sockets).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(harness.sockets).toHaveLength(2)
  })
})

describe('setCorporations', () => {
  it('opens one subscription for each Corporation and follows a discovery change', () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7, 9])
    expect(harness.sockets).toHaveLength(2)
    for (const socket of harness.sockets) socket.accept()
    expect(harness.sockets.map((socket) => socket.sent)).toEqual([
      [{ action: 'subscribe', corporationId: 7 }],
      [{ action: 'subscribe', corporationId: 9 }],
    ])

    harness.subscriptions.setCorporations([9])
    expect(harness.sockets[0].closed).toBe(true)
    expect(harness.sockets[1].closed).toBe(false)
    expect(harness.sockets).toHaveLength(2)
  })

  it('holds one unsubscribed socket when no Corporation is discovered', () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7])
    harness.subscriptions.setCorporations([])

    expect(harness.sockets[0].closed).toBe(true)
    const guest = harness.sockets[1]
    guest.accept()
    expect(guest.sent).toEqual([])

    guest.emit({ type: 'ready', block: 501, blockTime: BLOCK_TIME, blockIntervalMs: BLOCK_INTERVAL_MS })
    expect(harness.heights.at(-1)).toBe(500)
  })

  it('closes every socket on close', () => {
    const harness = createHarness()
    harness.subscriptions.setCorporations([7, 9])
    harness.subscriptions.close()
    expect(harness.sockets.map((socket) => socket.closed)).toEqual([true, true])
  })
})
