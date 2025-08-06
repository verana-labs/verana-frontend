'use client'

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { DidData } from '@/app/types/dataViewTypes';

export function useDIDData(id: string ) {
  const [dataDID, setData] = useState<DidData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorDIDData, setError] = useState<string | null>(null);

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID;

  useEffect(() => {
    if (!id || !getURL) {
      setError('Missing DID or endpoint URL');
      setLoading(false);
      return;
    }

    const fetchDid = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${getURL}/get/${decodeURIComponent(id)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error ${res.status}`);

        // Parse response: DidData or { did_entry: DidData }
        const json = await res.json();
        type ResponseShape = Partial<{ did_entry: DidData }> & DidData;
        const resp = json as ResponseShape;
        const entry = resp.did_entry ?? (resp as DidData);

        setData(entry);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDid();
  }, [id, getURL]);

  return { dataDID, loading, errorDIDData };
}
