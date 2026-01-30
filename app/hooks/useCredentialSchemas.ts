'use client';

import { useEffect, useState, useCallback } from 'react';
import { env } from 'next-runtime-env';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { CsList } from '@/ui/datatable/columnslist/cs';

type RawSchema = Record<string, unknown> & {
  id?: number;
  tr_id?: string | number;
  json_schema?: string;
  deposit?: string;
  issuer_grantor_validation_validity_period?: number;
  verifier_grantor_validation_validity_period?: number;
  issuer_validation_validity_period?: number;
  verifier_validation_validity_period?: number;
  holder_validation_validity_period?: number;
  issuer_perm_management_mode?: string;
  verifier_perm_management_mode?: string;
  archived?: boolean | string;
  created?: string;
  modified?: string;
  participants?: number;
  issued?: number;
  verified?: number;
};

export function useCSList(trId?: string, all: boolean = true, onlyActive: boolean = true) {

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;

  const [csList, setCsList] = useState<CsList[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCSList, setError] = useState<string | null>(null);

  const fetchCS = useCallback(async (activeOnly?: boolean) => {
    const useOnlyActive = activeOnly !== undefined ? activeOnly : onlyActive;

    if ((!all && !trId) || !getURL) {
      setError(resolveTranslatable({key: "error.fetch.cs"}, translate)?? 'Missing TR id or endpoint URL');
      setLoading(false);
      return;
    }

    // Reset state when inputs change
    setError(null);
    setCsList([]);

    // Build URL with query parameters
    // Note: only_active parameter is not yet supported by the API (returns 500)
    // We fetch all schemas and filter client-side for now
    const params = new URLSearchParams();
    if (trId !== undefined) {
      params.append('tr_id', trId);
    }

    const queryString = params.toString();
    const url = queryString ? `${getURL}/list?${queryString}` : `${getURL}/list`;

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok){
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }
      let schemas: RawSchema[] = Array.isArray(json) ? json : (json.schemas ?? []);

      // Client-side filtering for archived schemas (API doesn't support only_active yet)
      if (useOnlyActive) {
        schemas = schemas.filter((src) => {
          const isArchived = src.archived === true || src.archived === 'true';
          return !isArchived;
        });
      }

      const list: CsList[] = schemas.map((src) => {
        // Parse JSON schema safely
        let parsed: Record<string, unknown> = {};
        const rawJsonSchema = typeof src.json_schema === 'string' ? src.json_schema : '';
        try {
          parsed = rawJsonSchema ? JSON.parse(rawJsonSchema) : {};
        } catch (err) {
          console.error(`Failed to parse json_schema for credential schema id=${src.id}, tr_id=${src.tr_id}:`, err);
          parsed = {};
        }
        // Title comes from JSON schema title, fallback to 'Schema'
        const title =
          (parsed.title as string | undefined) ??
          'Schema';
        // Description comes from JSON schema description
        const description =
          (parsed.description as string | undefined) ?? '';

        // Parse archived field (can be boolean or string)
        const archived = src.archived === true || src.archived === 'true';

        return {
          id: (src.id)?.toString() ?? '',
          trId: (src.tr_id)?.toString() ?? '',
          issuerPermManagementMode: src.issuer_perm_management_mode ?? '',
          verifierPermManagementMode: src.verifier_perm_management_mode ?? '',
          issuerValidationValidityPeriod: src.issuer_grantor_validation_validity_period ?? 0,
          verifierValidationValidityPeriod: src.verifier_grantor_validation_validity_period ?? 0,
          jsonSchema: src.json_schema ?? '',
          title,
          description,
          role: "",
          participants: src.participants,
          issued: src.issued,
          verified: src.verified,
          archived,
        };
      });
      setCsList(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [trId, all, onlyActive, getURL]);

  useEffect(() => {
    fetchCS();
  }, [fetchCS]);

  return { csList, loading, errorCSList, refetch: fetchCS };
}