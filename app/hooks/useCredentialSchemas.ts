'use client';

import { useEffect, useState } from 'react';
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
  archived?: string;
  created?: string;
  modified?: string;
  title?: string;
  description?: string;
  participants?: number;
  issued?: number;
  verified?: number;
};

export function useCSList(trId?: string, all: boolean = true) {

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;

  const [csList, setCsList] = useState<CsList[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCSList, setError] = useState<string | null>(null);

  const fetchCS = async () => {

    if ((!all && !trId) || !getURL) {
      setError(resolveTranslatable({key: "error.fetch.cs"}, translate)?? 'Missing TR id or endpoint URL');
      setLoading(false);
      return;
    }

    // Reset state when inputs change
    setError(null);
    setCsList([]);
    const url = ( trId == undefined && all )? `${getURL}/list` : `${getURL}/list?tr_id=${trId}`;
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
        const title = (typeof src.title === 'string' && src.title.trim())
          ? src.title
          : (parsed.title as string | undefined) || 'Schema';

        const description = (typeof src.description === 'string' && src.description.trim())
          ? src.description
          : (parsed.description as string | undefined) || '';

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
          participants: src.participants ?? 0,
          issuedCredentials: src.issued ?? 0,
          verifiedCredentials: src.verified ?? 0,
          archived: src.archived ?? '',
          role: "",
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