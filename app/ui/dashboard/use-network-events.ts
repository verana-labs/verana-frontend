'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { logger } from '@/lib/logger'
import { useIndexerEvents } from '@/providers/indexer-events-provider'

export type NetworkEvent = {
  key: string
  eventType: string
  module: string
  entityType: string | null
  entityId: string | null
  ecosystemId: string | null
  did: string | null
  blockHeight: number
  timestamp: string | null
}

const PAGE_LIMIT = 500
const LOOKBACK_BLOCKS = [500, 5_000, 50_000, 500_000]
const MAX_PAGES = 40
const POLL_MIN_MS = 12_000
const KEEP = 30

export type Announcement = { count: number; newest: NetworkEvent }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  if (typeof value === 'number') return String(value)
  return null
}

function parseEvent(value: unknown): NetworkEvent | null {
  if (!isRecord(value) || !isRecord(value.payload)) return null
  const { payload } = value
  const eventType = text(value.event_type)
  const blockHeight = value.block_height
  const txHash = text(value.tx_hash)
  if (!eventType || typeof blockHeight !== 'number' || !txHash) return null
  return {
    key: `${txHash}#${text(payload.message_index) ?? '0'}#${eventType}`,
    eventType,
    module: text(payload.module) ?? '',
    entityType: text(payload.entity_type),
    entityId: text(payload.entity_id),
    ecosystemId: text(payload.ecosystem_id),
    did: text(value.did),
    blockHeight,
    timestamp: text(value.timestamp),
  }
}

async function fetchPage(after: number, signal: AbortSignal): Promise<NetworkEvent[]> {
  const url = `${VERANA_REST_ENDPOINT_INDEXER}/events?after_block_height=${after}&limit=${PAGE_LIMIT}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  const json: unknown = await response.json()
  const list = isRecord(json) && Array.isArray(json.events) ? json.events : []
  return list.map(parseEvent).filter((event): event is NetworkEvent => event !== null)
}

async function fetchAfter(after: number, signal: AbortSignal): Promise<{ events: NetworkEvent[]; total: number }> {
  let events: NetworkEvent[] = []
  let total = 0
  let cursor = after
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await fetchPage(cursor, signal)
    total += batch.length
    events = [...events, ...batch].slice(-KEEP)
    if (batch.length < PAGE_LIMIT) break
    cursor = batch[batch.length - 1].blockHeight
  }
  return { events, total }
}

async function fetchLatest(height: number, want: number, signal: AbortSignal): Promise<NetworkEvent[]> {
  for (const lookback of LOOKBACK_BLOCKS) {
    if (lookback >= height) break
    const { events, total } = await fetchAfter(height - lookback, signal)
    if (total >= want) return events
  }
  return (await fetchAfter(0, signal)).events
}

function newestFirst(events: NetworkEvent[]): NetworkEvent[] {
  return [...events].reverse()
}

export function useNetworkEvents(want = 8) {
  const { latestProcessedHeight } = useIndexerEvents()
  const [events, setEvents] = useState<NetworkEvent[] | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const pendingRef = useRef<NetworkEvent[]>([])
  const [error, setError] = useState(false)
  const [paused, setPaused] = useState(false)
  const [announced, setAnnounced] = useState<Announcement | null>(null)
  const [attempt, setAttempt] = useState(0)
  const cursorRef = useRef<number | null>(null)
  const pausedRef = useRef(false)
  const lastPollRef = useRef(0)
  const inFlightRef = useRef(false)
  const seenRef = useRef(new Set<string>())
  const unmountRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    unmountRef.current = controller
    return () => controller.abort()
  }, [])

  pausedRef.current = paused

  const fresh = useCallback((list: NetworkEvent[]) => {
    const unseen = list.filter((event) => !seenRef.current.has(event.key))
    for (const event of unseen) seenRef.current.add(event.key)
    return unseen
  }, [])

  const hasHeight = latestProcessedHeight > 0
  const heightRef = useRef(latestProcessedHeight)
  heightRef.current = latestProcessedHeight

  useEffect(() => {
    if (!hasHeight || !VERANA_REST_ENDPOINT_INDEXER || attempt < 0) return
    const controller = new AbortController()
    setError(false)
    const height = heightRef.current
    fetchLatest(height, want, controller.signal)
      .then((list) => {
        const recent = fresh(list).slice(-KEEP)
        cursorRef.current = Math.max(height, recent.at(-1)?.blockHeight ?? 0)
        setEvents(newestFirst(recent))
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        logger.warn('Dashboard activity feed failed', reason)
        setError(true)
      })
    return () => controller.abort()
  }, [hasHeight, want, fresh, attempt])

  useEffect(() => {
    const cursor = cursorRef.current
    if (cursor === null || latestProcessedHeight <= cursor || inFlightRef.current) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    const now = Date.now()
    if (now - lastPollRef.current < POLL_MIN_MS) return
    lastPollRef.current = now
    inFlightRef.current = true
    const controller = unmountRef.current ?? new AbortController()
    fetchAfter(cursor, controller.signal)
      .then(({ events: list }) => {
        cursorRef.current = Math.max(cursor, latestProcessedHeight, list.at(-1)?.blockHeight ?? 0)
        const added = fresh(list)
        if (added.length === 0) return
        if (pausedRef.current) {
          pendingRef.current = [...newestFirst(added), ...pendingRef.current].slice(0, KEEP)
          setPendingCount(pendingRef.current.length)
          return
        }
        const ordered = newestFirst(added)
        setEvents((prev) => [...ordered, ...(prev ?? [])].slice(0, KEEP))
        setAnnounced({ count: added.length, newest: ordered[0] })
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) logger.warn('Dashboard activity poll failed', reason)
      })
      .finally(() => {
        inFlightRef.current = false
      })
  }, [latestProcessedHeight, fresh])

  const flush = useCallback(() => {
    const queued = pendingRef.current
    pendingRef.current = []
    setPendingCount(0)
    if (queued.length === 0) return
    setEvents((prev) => [...queued, ...(prev ?? [])].slice(0, KEEP))
    setAnnounced({ count: queued.length, newest: queued[0] })
  }, [])

  const togglePaused = useCallback(() => {
    if (pausedRef.current) flush()
    setPaused(!pausedRef.current)
  }, [flush])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return {
    events: events?.slice(0, want) ?? null,
    loading: events === null && !error,
    error: error && events === null,
    paused,
    pendingCount,
    announced,
    togglePaused,
    flush,
    retry,
  }
}
