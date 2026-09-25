'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_INDEXER } from '@/config/env'
import { type IndexerBlockEvent, type IndexerEvent, parseIndexerBlockHeight } from '@/lib/indexer-event'
import { createIndexerSubscriptions, type IndexerSubscriptions } from '@/lib/indexer-subscription'
import { logger } from '@/lib/logger'
import { useComponentsVersion } from '@/providers/components-version-provider'

type Waiting = {
  targetHeight: number
  resolve: () => void
  reject: (reason?: unknown) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

export type IndexerEventListener = (corporationId: number, events: IndexerEvent[]) => void

type IndexerEventsContextType = {
  isConnected: boolean
  latestProcessedHeight: number
  latestProcessedTimestamp: string | null
  waitForBlock: (targetHeight: number, timeoutMs?: number) => Promise<void>
  getLatestProcessedBlock: () => number
  setSubscribedCorporations: (corporationIds: number[]) => void
  addIndexerEventListener: (listener: IndexerEventListener) => () => void
}

const IndexerEventsContext = createContext<IndexerEventsContextType | null>(null)

export function IndexerEventsProvider({ children }: { children: React.ReactNode }) {
  const subscriptionsRef = useRef<IndexerSubscriptions | null>(null)
  const corporationIdsRef = useRef<number[]>([])
  const listenersRef = useRef<Set<IndexerEventListener>>(new Set())
  const waitingRef = useRef<Waiting[]>([])
  const heightPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestProcessedHeightRef = useRef(0)
  const latestProcessedTimestampRef = useRef<string | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [latestProcessedHeight, setLatestProcessedHeight] = useState(0)
  const [latestProcessedTimestamp, setLatestProcessedTimestamp] = useState<string | null>(null)

  const { setState: setVersionState } = useComponentsVersion()

  const applyBlock = useCallback(
    (block: IndexerBlockEvent) => {
      // Several subscriptions report the same blocks, so the height only moves forward.
      if (block.height < latestProcessedHeightRef.current) return
      latestProcessedHeightRef.current = block.height
      latestProcessedTimestampRef.current = block.timestamp
      setLatestProcessedHeight(block.height)
      setLatestProcessedTimestamp(block.timestamp)
      setVersionState((prev) => ({
        ...prev,
        indexer: { ...prev.indexer, lastProcessedBlock: block.height },
      }))
      const ready: Waiting[] = []
      const pending: Waiting[] = []
      for (const waiting of waitingRef.current) {
        if (block.height >= waiting.targetHeight) {
          ready.push(waiting)
        } else {
          pending.push(waiting)
        }
      }
      waitingRef.current = pending
      for (const waiting of ready) {
        if (waiting.timeoutId) clearTimeout(waiting.timeoutId)
        logger.info('waitForBlock:resolved-from-event', {
          targetHeight: waiting.targetHeight,
          latestProcessedHeight: block.height,
          date: new Date().toLocaleTimeString(),
        })
        waiting.resolve()
      }
    },
    [setVersionState]
  )

  const fetchProcessedHeight = useCallback(
    async (signal?: AbortSignal) => {
      if (!VERANA_REST_ENDPOINT_INDEXER) return
      const response = await fetch(`${VERANA_REST_ENDPOINT_INDEXER}/block-height`, { signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const block = parseIndexerBlockHeight(await response.json())
      if (block) applyBlock(block)
    },
    [applyBlock]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchProcessedHeight(controller.signal).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      logger.error('Failed to seed the indexer height', error)
    })
    return () => controller.abort()
  }, [fetchProcessedHeight])

  useEffect(() => {
    const subscriptions = createIndexerSubscriptions({
      onProcessedBlock: (height, blockTime) => applyBlock({ height, timestamp: blockTime }),
      onEvents: (corporationId, events) => {
        for (const listener of listenersRef.current) listener(corporationId, events)
      },
      onConnectionChange: setIsConnected,
    })
    subscriptionsRef.current = subscriptions
    // A child effect can set the corporations before this effect runs.
    subscriptions.setCorporations(corporationIdsRef.current)

    return () => {
      subscriptionsRef.current = null
      subscriptions.close()
      if (heightPollTimerRef.current) clearTimeout(heightPollTimerRef.current)
      heightPollTimerRef.current = null
      for (const waiting of waitingRef.current) {
        if (waiting.timeoutId) clearTimeout(waiting.timeoutId)
        waiting.reject(new Error('IndexerEventsProvider unmounted'))
      }
      waitingRef.current = []
    }
  }, [applyBlock])

  const setSubscribedCorporations = useCallback((corporationIds: number[]) => {
    corporationIdsRef.current = corporationIds
    subscriptionsRef.current?.setCorporations(corporationIds)
  }, [])

  const addIndexerEventListener = useCallback((listener: IndexerEventListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const armHeightFallback = useCallback(() => {
    if (heightPollTimerRef.current) return
    const tick = async () => {
      heightPollTimerRef.current = null
      const subscriptions = subscriptionsRef.current
      if (!subscriptions || waitingRef.current.length === 0) return
      try {
        await fetchProcessedHeight()
      } catch (error) {
        logger.warn('Indexer height fallback failed', error)
      }
      if (waitingRef.current.length > 0) {
        heightPollTimerRef.current = setTimeout(tick, subscriptions.getBlockIntervalMs())
      }
    }
    // [VFE-DATA-WS-4] falls back to the block-height query when no block envelope arrives in time.
    heightPollTimerRef.current = setTimeout(tick, 2 * (subscriptionsRef.current?.getBlockIntervalMs() ?? 0))
  }, [fetchProcessedHeight])

  const waitForBlock = useCallback(
    (targetHeight: number, timeoutMs = 30000) => {
      const currentHeight = latestProcessedHeightRef.current
      logger.info('waitForBlock:start', {
        targetHeight,
        latestProcessedHeight: currentHeight,
        date: new Date().toLocaleTimeString(),
      })
      if (currentHeight >= targetHeight) {
        logger.info('waitForBlock:resolved-immediately', {
          targetHeight,
          latestProcessedHeight: currentHeight,
          date: new Date().toLocaleTimeString(),
        })
        return Promise.resolve()
      }
      return new Promise<void>((resolve, reject) => {
        const waiting: Waiting = {
          targetHeight,
          resolve,
          reject,
        }
        if (timeoutMs > 0) {
          waiting.timeoutId = setTimeout(() => {
            logger.error('waitForBlock:timeout', {
              targetHeight,
              latestProcessedHeight: latestProcessedHeightRef.current,
              waitingCount: waitingRef.current.length,
              date: new Date().toLocaleTimeString(),
            })
            waitingRef.current = waitingRef.current.filter((w) => w !== waiting)
            reject(new Error(`Timed out waiting for indexer to process block ${targetHeight}`))
          }, timeoutMs)
        }
        waitingRef.current.push(waiting)
        armHeightFallback()
      })
    },
    [armHeightFallback]
  )

  const getLatestProcessedBlock = useCallback(() => {
    return latestProcessedHeightRef.current
  }, [])

  const value = useMemo(
    () => ({
      isConnected,
      latestProcessedHeight,
      latestProcessedTimestamp,
      waitForBlock,
      getLatestProcessedBlock,
      setSubscribedCorporations,
      addIndexerEventListener,
    }),
    [
      isConnected,
      latestProcessedHeight,
      latestProcessedTimestamp,
      waitForBlock,
      getLatestProcessedBlock,
      setSubscribedCorporations,
      addIndexerEventListener,
    ]
  )

  return <IndexerEventsContext.Provider value={value}>{children}</IndexerEventsContext.Provider>
}

export function useIndexerEvents() {
  const context = useContext(IndexerEventsContext)
  if (!context) {
    throw new Error('useIndexerEvents must be used within IndexerEventsProvider')
  }
  return context
}
