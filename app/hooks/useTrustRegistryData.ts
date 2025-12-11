'use client'

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { TrData } from '@/ui/dataview/datasections/tr';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { ApiErrorResponse } from '@/types/apiErrorResponse';

export function useTrustRegistryData(id: string,  ) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;
  const [dataTR, setData] = useState<TrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorTRData, setError] = useState<string | null>(null);

  const fetchTR = async () => {
    try {
      if (!id || !getURL) {
        setError(resolveTranslatable({key: "error.fetch.tr"}, translate)??'Missing Tust Registry or endpoint URL');    
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const url = `${getURL}/get/${id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok){
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      } 
      type ResponseShape = Partial<{ trust_registry: TrData }> & TrData;
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
  }, []);

  return { dataTR, loading, errorTRData, refetch: fetchTR };
}
