'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { CsData } from '@/app/types/dataViewTypes';

type RawSchema = Record<string, unknown> & {
  id?: string | number;
  tr_id?: string | number;
  creator?: string;
  json_schema?: string;
  issuer_grantor_validation_validity_period?: number;
  verifier_grantor_validation_validity_period?: number;
  issuer_validation_validity_period?: number;
  verifier_validation_validity_period?: number;
  holder_validation_validity_period?: number;
  issuer_perm_management_mode?: number;
  verifier_perm_management_mode?: number;
};

export function useCSList(trId: string) {

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;

  const [csList, setCsList] = useState<CsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCSList, setError] = useState<string | null>(null);

  const fetchCS = async () => {

    if (!trId || !getURL) {
      setError('Missing TR ID or endpoint URL');
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
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const schemas: RawSchema[] = Array.isArray(json) ? json : (json.schemas ?? []);
      const list: CsData[] = schemas.map((src) => {
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
        const id = src.id ?? '';
        return {
          id,
          trId: src.tr_id ?? '',
          creator: src.creator ?? '',
          issuerGrantorValidationValidityPeriod: src.issuer_grantor_validation_validity_period ?? 0,
          verifierGrantorValidationValidityPeriod: src.verifier_grantor_validation_validity_period ?? 0,
          issuerValidationValidityPeriod: src.issuer_validation_validity_period ?? 0,
          verifierValidationValidityPeriod: src.verifier_validation_validity_period ?? 0,
          holderValidationValidityPeriod: src.holder_validation_validity_period ?? 0,
          issuerPermManagementMode: src.issuer_perm_management_mode ?? 0,
          verifierPermManagementMode: src.verifier_perm_management_mode ?? 0,
          jsonSchema: src.json_schema ?? '',
          title: `${titleCandidate} (id: ${id})`,
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