'use client';

import { useEffect } from 'react';
import { env } from 'next-runtime-env';
import { useComponentsVersion } from '@/providers/components-version-provider';

export function useIndexerVersion() {
  const { setState } = useComponentsVersion();

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchVersion = async () => {
      try {
        const indexerEndpoint =
          env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_INDEXER') ||
          process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_INDEXER;
        if (!indexerEndpoint) return;

        const response = await fetch(
          `${indexerEndpoint}/version`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Failed to load indexer version: ${response.status}`);
        const data = await response.json();
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            indexer: {
              ...prev.indexer,
              version: data?.appVersion ?? null,
            },
          }));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!ignore) {
          setState((prev) => ({
            ...prev,
            indexer: {
              ...prev.indexer,
              version: null,
            },
          }));
        }
        console.error('Failed to load indexer version', err);
      }
    };

    fetchVersion();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);
}
