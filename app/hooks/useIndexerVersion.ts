'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';

export function useIndexerVersion() {
  const [version, setVersion] = useState<string | null>(null);

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
          setVersion(data?.appVersion ?? null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!ignore) setVersion(null);
        console.error('Failed to load indexer version', err);
      }
    };

    fetchVersion();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  return version;
}
