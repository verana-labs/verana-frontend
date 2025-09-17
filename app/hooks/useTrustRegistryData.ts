'use client'

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { TrData } from '@/app/types/dataViewTypes';

export function useTrustRegistryData(id: string,  ) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;
  const [dataTR, setData] = useState<TrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorTRData, setError] = useState<string | null>(null);

  const fetchTR = async () => {
    try {
      if (!id) {
        setError('Missing Tust Registry');
        setLoading(false);
        return;
      }
      if (!getURL) {
        setError('API endpoint not configured');    
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const url = `${getURL}/get/${id}`;
      const res = await fetch(url);
      if (!res.ok) setError(`Error ${res.status}`);
      type ResponseShape = Partial<{ trust_registry: TrData }> & TrData;
      const json: unknown = await res.json();
      const resp = json as ResponseShape;
      const entry = resp.trust_registry ?? (resp as TrData);
      setData(entry);
    } catch (err) {
      setError (err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTR();
  }, [id, getURL, fetchTR]);

  return { dataTR, loading, errorTRData, refetch: fetchTR };
}
