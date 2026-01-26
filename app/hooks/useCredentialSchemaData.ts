'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { CsData } from '@/ui/dataview/datasections/cs';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { ApiErrorResponse } from '@/types/apiErrorResponse';

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

export function useCsData(id: string) {

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;

  const [csData, setData] = useState<CsData| null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCS, setError] = useState<string | null>(null);

  // Clear previous result when id changes to avoid stale data being reused
  useEffect(() => {
    setData(null);
    setError(null);
  }, [id]);

  const fetchCS = async () => {

    if (!id || !getURL) {
      setError(resolveTranslatable({key: "error.fetch.cs"}, translate)?? 'Missing CS id or endpoint URL');
      setLoading(false);
      return;
    }

    // Reset state when inputs change
    setError(null);
    const url = `${getURL}/get/${id}`;
    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok){
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      } 

      type ResponseShape = { schema: RawSchema };
      const resp = json as ResponseShape;
      const entry = resp.schema ?? (resp as RawSchema);
      
      // Parse JSON schema safely
      let parsed: Record<string, unknown> = {};
      const rawJsonSchema = typeof entry.json_schema === 'string' ? entry.json_schema : '';
      try {
        parsed = rawJsonSchema ? JSON.parse(rawJsonSchema) : {};
      } catch {
        parsed = {};
      }
      const id = entry.id ?? '';
      const titleCandidate = (parsed.title as string | undefined) ?? `Schema (id: ${id})`;
      const descCandidate =  (parsed.description as string | undefined) ?? "";

      setData(
        {
          id,
          trId: entry.tr_id ?? '',
          creator: entry.creator ?? '',
          issuerGrantorValidationValidityPeriod: entry.issuer_grantor_validation_validity_period ?? 0,
          verifierGrantorValidationValidityPeriod: entry.verifier_grantor_validation_validity_period ?? 0,
          issuerValidationValidityPeriod: entry.issuer_validation_validity_period ?? 0,
          verifierValidationValidityPeriod: entry.verifier_validation_validity_period ?? 0,
          holderValidationValidityPeriod: entry.holder_validation_validity_period ?? 0,
          issuerPermManagementMode: entry.issuer_perm_management_mode ?? 0,
          verifierPermManagementMode: entry.verifier_perm_management_mode ?? 0,
          jsonSchema: entry.json_schema ?? '',
          title: `${titleCandidate}`,
          description: `${descCandidate}`,
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever id changes
  useEffect(() => {
    if (!id) return;
    fetchCS();
  }, [id, fetchCS]);

  return { csData, loading, errorCS, refetch: fetchCS };
}