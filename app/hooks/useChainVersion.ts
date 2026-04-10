'use client';

import { useEffect } from 'react';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useComponentsVersion } from '@/providers/components-version-provider';

/**
 * Fetches the chain version reported by the connected node.
 * Returns null until the version is successfully resolved.
 */
export function useChainVersion() {
  const veranaChain = useVeranaChain();
  const restEndpoint = veranaChain?.apis?.rest?.[0]?.address;
  const { setState } = useComponentsVersion();

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
          setState((prev) => ({
            ...prev,
            ledger: {
              ...prev.ledger,
              version: remoteVersion,
            },
          }));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        if (!ignore) {
          setState((prev) => ({
            ...prev,
            ledger: {
              ...prev.ledger,
              version: null,
            },
          }));
        }

        console.error('Failed to load chain version', err);
      }
    };

    fetchVersion();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [restEndpoint, setState]);
}
