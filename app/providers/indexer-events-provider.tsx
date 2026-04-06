"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import { env } from 'next-runtime-env';
import { useComponentsVersion } from '@/providers/components-version-provider';

type BlockProcessedEvent = {
  type: "block-processed";
  height: number;
  timestamp: string;
};

type Waiting = {
  targetHeight: number;
  resolve: () => void;
  reject: (reason?: unknown) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
};

type IndexerEventsContextType = {
  isConnected: boolean;
  latestProcessedHeight: number;
  latestProcessedTimestamp: string | null;
  waitForBlock: (targetHeight: number, timeoutMs?: number) => Promise<void>;
  getLatestProcessedBlock: () => number;
};

const IndexerEventsContext = createContext<IndexerEventsContextType | null>(null);

export function IndexerEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingRef = useRef<Waiting[]>([]);
  const latestProcessedHeightRef = useRef(0);
  const latestProcessedTimestampRef = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [latestProcessedHeight, setLatestProcessedHeight] = useState(0);
  const [latestProcessedTimestamp, setLatestProcessedTimestamp] = useState<string | null>(null);

  const { setState: setVersionState } = useComponentsVersion();

  useEffect(() => {
    let unmounted = false;
    let reconnectAttempts = 0;
    const cleanupSocket = () => {
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    const connect = () => {
      if (unmounted) return;
      const wsUrl =  env('NEXT_PUBLIC_VERANA_WEBSOCKET') || process.env.NEXT_PUBLIC_VERANA_WEBSOCKET;
      if (!wsUrl) {
        console.error("NEXT_PUBLIC_VERANA_WEBSOCKET is not defined");
        return;
      }
      const ws = new WebSocket(wsUrl);

      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) return;
        setIsConnected(true);
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BlockProcessedEvent;
          if (data.type !== "block-processed") return;
          latestProcessedHeightRef.current = data.height;
          latestProcessedTimestampRef.current = data.timestamp;
          setLatestProcessedHeight(data.height);
          setLatestProcessedTimestamp(data.timestamp);
          setVersionState((prev) => ({
            ...prev,
            indexer: { ...prev.indexer, lastProcessedBlock: data.height },
          }));
          const ready: Waiting[] = [];
          const pending: Waiting[] = [];
          for (const waiting of waitingRef.current) {
            if (data.height >= waiting.targetHeight) {
              ready.push(waiting);
            } else {
              pending.push(waiting);
            }
          }
          waitingRef.current = pending;
          for (const waiting of ready) {
            if (waiting.timeoutId) clearTimeout(waiting.timeoutId);
            console.info("waitForBlock:resolved-from-event", {targetHeight: waiting.targetHeight, latestProcessedHeight: data.height, date: new Date().toLocaleTimeString()});
            waiting.resolve();
          }
        } catch (error) {
          console.error("Failed to parse indexer websocket event:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("Indexer websocket error:", error);
      };

      ws.onclose = () => {
        if (unmounted) return;
        setIsConnected(false);
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 10000);
        reconnectAttempts += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      for (const waiting of waitingRef.current) {
        if (waiting.timeoutId) clearTimeout(waiting.timeoutId);
        waiting.reject(new Error("IndexerEventsProvider unmounted"));
      }
      waitingRef.current = [];
      cleanupSocket();
    };
  }, []);

  const waitForBlock = useCallback(
    (targetHeight: number, timeoutMs = 10000) => {
      const currentHeight = latestProcessedHeightRef.current;
      console.info("waitForBlock:start", {targetHeight, latestProcessedHeight: currentHeight, date: new Date().toLocaleTimeString()});
      if (currentHeight >= targetHeight) {
        console.info("waitForBlock:resolved-immediately", {targetHeight, latestProcessedHeight: currentHeight, date: new Date().toLocaleTimeString()});
        return Promise.resolve();
      }
      return new Promise<void>((resolve, reject) => {
        const waiting: Waiting = {
          targetHeight,
          resolve,
          reject,
        };
        if (timeoutMs > 0) {
          waiting.timeoutId = setTimeout(() => {
            console.error("waitForBlock:timeout", { targetHeight, latestProcessedHeight: latestProcessedHeightRef.current, waitingCount: waitingRef.current.length, date: new Date().toLocaleTimeString()});
            waitingRef.current = waitingRef.current.filter((w) => w !== waiting);
            reject(
              new Error(
                `Timed out waiting for indexer to process block ${targetHeight}`
              )
            );
          }, timeoutMs);
        }
        waitingRef.current.push(waiting);
      });
    },
    []
  );

  const getLatestProcessedBlock = useCallback(() => {
    return latestProcessedHeightRef.current;
  }, []);

  const value = useMemo(
    () => ({
      isConnected,
      latestProcessedHeight,
      latestProcessedTimestamp,
      waitForBlock,
     getLatestProcessedBlock     
    }),
    [isConnected, latestProcessedHeight, latestProcessedTimestamp, waitForBlock, getLatestProcessedBlock]
  );

  return (
    <IndexerEventsContext.Provider value={value}>
      {children}
    </IndexerEventsContext.Provider>
  );
}

export function useIndexerEvents() {
  const context = useContext(IndexerEventsContext);
  if (!context) {
    throw new Error("useIndexerEvents must be used within IndexerEventsProvider");
  }
  return context;
}