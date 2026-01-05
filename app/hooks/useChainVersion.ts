'use client';

import { useEffect, useState } from 'react';
import { useVeranaChain } from '@/hooks/useVeranaChain';

/**
 * Fetches the chain version reported by the connected node.
 * Returns null until the version is successfully resolved.
 */
export function useChainVersion() {
  const veranaChain = useVeranaChain();
  const restEndpoint = veranaChain?.apis?.rest?.[0]?.address;
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchVersion = async () => {
      try {
        if (!restEndpoint) return;

        const response = await fetch(
          `${restEndpoint.replace(/\/$/, '')}/cosmos/base/tendermint/v1beta1/node_info`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Failed to load version: ${response.status}`);
        const data = await response.json();
        const remoteVersion = data?.application_version?.version ?? null;
        if (!ignore) {
          setVersion(remoteVersion);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (!ignore) setVersion(null);
        console.error('Failed to load chain version', err);
      }
    };

    fetchVersion();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [restEndpoint]);

  return version;
}
