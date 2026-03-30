'use client';

import { useEffect, useState } from 'react';
import { useVeranaChain } from '@/hooks/useVeranaChain';

export function useLatestBlockHeight() {
  const veranaChain = useVeranaChain();
  const restEndpoint = veranaChain?.apis?.rest?.[0]?.address;
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchHeight = async () => {
      try {
        if (!restEndpoint) return;

        const response = await fetch(
          `${restEndpoint.replace(/\/$/, '')}/cosmos/base/tendermint/v1beta1/blocks/latest`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Failed to load latest block: ${response.status}`);

        const data = await response.json();
        const latestHeight = Number(data?.block?.header?.height ?? data?.sdk_block?.header?.height ?? 0);

        if (!ignore && Number.isFinite(latestHeight) && latestHeight > 0) {
          setHeight(latestHeight);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (!ignore) setHeight(null);
        console.error('Failed to load latest block height', err);
      }
    };

    fetchHeight();
    const intervalId = setInterval(fetchHeight, 30000);

    return () => {
      ignore = true;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [restEndpoint]);

  return height;
}
