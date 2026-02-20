'use client';

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { GlobalMetrics } from '@/ui/dataview/datasections/dashboard';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { ApiErrorResponse } from '@/types/apiErrorResponse';

export function useGlobalMetrics() {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS;
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMetrics, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      if (!getURL) {
        setError(resolveTranslatable({key: "error.fetch.metrics"}, translate) ?? 'Missing metrics endpoint URL');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const url = `${getURL}/all`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }
      setMetrics(json as GlobalMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return { metrics, loading, errorMetrics, refetch: fetchMetrics };
}
