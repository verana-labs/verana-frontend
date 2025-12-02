'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { CsData } from '@/ui/dataview/datasections/cs';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { CsList } from '@/ui/datatable/columnslist/cs';

type RawSchema = Record<string, unknown> & {
  id?: string | number;
  created?: string;
  modified?: string;
  json_schema?: string;
};

export function useCSList(trId: string) {

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;

  const [csList, setCsList] = useState<CsList[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCSList, setError] = useState<string | null>(null);

  const fetchCS = async () => {

    if (!trId || !getURL) {
      setError(resolveTranslatable({key: "error.fetch.cs"}, translate)?? 'Missing TR id or endpoint URL');
      setLoading(false);
      return;
    }

    // Reset state when inputs change
    setError(null);
    setCsList([]);
    const url = `${getURL}/list?tr_id=${trId}`;
    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok){
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      } 
      const schemas: RawSchema[] = Array.isArray(json) ? json : (json.schemas ?? []);
      const list: CsList[] = schemas.map((src) => {
        // Parse JSON schema safely
        let parsed: Record<string, unknown> = {};
        const rawJsonSchema = typeof src.json_schema === 'string' ? src.json_schema : '';
        try {
          parsed = rawJsonSchema ? JSON.parse(rawJsonSchema) : {};
        } catch {
          parsed = {};
        }
        const titleCandidate =
          (parsed.description as string | undefined) ??
          (parsed.title as string | undefined) ??
          'Schema';
        return {
          id: (src.id)?.toString() ?? '',
          created: src.created ?? '',
          modified: src.modified ?? '',
          title: titleCandidate,
          description: "",
          role: ""
        };
      });
      setCsList(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCS();
  }, []);

  return { csList, loading, errorCSList, refetch: fetchCS };
}