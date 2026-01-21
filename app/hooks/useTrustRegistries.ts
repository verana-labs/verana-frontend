'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { TrList } from '@/ui/datatable/columnslist/tr';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';

/**
 * Safely fetch JSON from a URL, throwing a clear error if the response is not JSON
 */
async function fetchJson<T>(url: string): Promise<{ data: T; response: Response }> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON from ${url} but got ${contentType || 'unknown'}: ${text.substring(0, 100)}...`);
  }

  const data = await response.json() as T;
  return { data, response };
}

type RawPerm = {
  id: string | number;
  schema_id: string | number;
  type: string;
};

type ResponseWrappedSchema = { schema: { tr_id: string | number } };

type ResponseWrappedTr = { trust_registry: TrList };

export function useTrustRegistries (all: boolean = false) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name);

  // const address = "verana1evvrzxw9yg5staqdvumd6fupy3jhaxfflla7st";

  const permListURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;
  const getCsURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA;
  const getTrURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;

  const [trList, setTrList] = useState<TrList[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorTrList, setError] = useState<string | null>(null);

  
  const fetchTrList = async () => {

    if (!address || !isWalletConnected || !getStargateClient || !permListURL || !getCsURL || !getTrURL) {
      setError(resolveTranslatable({key: "error.fetch.tr"}, translate)?? 'Missing address or endpoint URL');
      setLoading(false);
      return;
    }

    // Reset state when inputs change
    setError(null);
    setTrList([]);
    try {
      setLoading(true);
      const urlTrList = all ? `${getTrURL}/list` : `${getTrURL}/list?controller=${address}&response_max_size=1024`;
      const { data: jsonTrList, response: resTrList } = await fetchJson<{ trust_registries?: TrList[] } & ApiErrorResponse>(urlTrList);
      if (!resTrList.ok) {
        const { error, code } = jsonTrList;
        setError(`Error ${code}: ${error}`);
        return;
      }
      const trListController: TrList[] = Array.isArray(jsonTrList.trust_registries) ? jsonTrList.trust_registries : [];
      if (all) {
        setTrList(trListController);
        return;
      }

      const seenTrIds = new Map<string, string>();
      trListController.forEach(tr => {
        if (tr.id != null) seenTrIds.set(String(tr.id), "");
      });

      const urlPerm = `${permListURL}/list?grantee=${address}&only_valid=true`;
      const { data: jsonPerm, response: resPerm } = await fetchJson<{ permissions?: RawPerm[] } & ApiErrorResponse>(urlPerm);
      if (!resPerm.ok) {
        const { error, code } = jsonPerm;
        setError(`Error ${code}: ${error}`);
        return;
      }
      const perms: RawPerm[] = Array.isArray(jsonPerm?.permissions) ? jsonPerm.permissions : [];

      const trListPerm: TrList[] = [];
      for (const permission of perms) {
        const urlSchema = `${getCsURL}/get/${permission.schema_id}`;
        const { data: jsonSchema, response: resSchema } = await fetchJson<ResponseWrappedSchema & ApiErrorResponse>(urlSchema);
        if (!resSchema.ok) {
          const { error, code } = jsonSchema;
          setError(`Error ${code}: ${error}`);
          return;
        }
        const { tr_id } = jsonSchema.schema;
        const trKey = String(tr_id);
        const trSeen = seenTrIds.get(trKey);
        if (trSeen != undefined) {
          const perms = trSeen.split(",").filter(Boolean);
          if (!perms.includes(permission.type)) perms.push(permission.type);
          seenTrIds.set(trKey, perms.join(","));
          continue;
        }
        seenTrIds.set(trKey, permission.type);

        const urlTr = `${getTrURL}/get/${tr_id}`;
        const { data: jsonTr, response: resTr } = await fetchJson<ResponseWrappedTr & ApiErrorResponse>(urlTr);
        if (!resTr.ok) {
          const { error, code } = jsonTr;
          setError(`Error ${code}: ${error}`);
          return;
        }
        const trEntry = jsonTr.trust_registry;
        trListPerm.push(trEntry);
      }
      
      const trListAll: TrList[] = [...trListController, ...trListPerm].map(tr => {
        const rolesStr = seenTrIds.get(tr.id);
        if (!rolesStr) return tr;
        return { ...tr, role: rolesStr };
      });
      setTrList(trListAll);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrList();
  }, []);

  return { trList, loading, errorTrList, refetch: fetchTrList };
}