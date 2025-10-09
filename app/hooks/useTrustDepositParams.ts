'use client';

import { useEffect, useState } from 'react';
import {
  getTrustDepositParams,
  trustDepositParamsInitialState,
  TrustDepositParams,
} from '@/app/lib/trustDepositParams';

export function useTrustDepositParams() {
  const [params, setParams] = useState<TrustDepositParams>(trustDepositParamsInitialState);
  const [loading, setLoading] = useState(false);
  const [errorTrustDepositParams, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { params: nextParams, errorTrustDepositParams: error } = await getTrustDepositParams();
        if (cancelled) return;

        setParams(nextParams);
        setError(error);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...params,
    loading,
    errorTrustDepositParams,
  };
}
