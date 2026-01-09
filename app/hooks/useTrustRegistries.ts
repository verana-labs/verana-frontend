'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { TrList } from '@/ui/datatable/columnslist/tr';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';

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
      const resTrList = await fetch(urlTrList);
      const jsonTrList = await resTrList.json();
      if (!resTrList.ok){
        const { error, code } = jsonTrList as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      } 
      const trListController: TrList[] = Array.isArray(jsonTrList.trust_registries) ? jsonTrList.trust_registries : [];
      if (all){
        setTrList(trListController);
        return;
      }
      
      const seenTrIds = new Map<string, string>();
      trListController.forEach(tr => {
        if (tr.id != null) seenTrIds.set(String(tr.id), "");
      });

      const urlPerm = `${permListURL}/list?grantee=${address}&only_valid=true`;
      const resPerm = await fetch(urlPerm);
      const jsonPerm = await resPerm.json();
      if (!resPerm.ok){
        const { error, code } = jsonPerm as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      } 
      const perms: RawPerm[] = Array.isArray(jsonPerm?.permissions) ? jsonPerm.permissions: [];
      
      const trListPerm: TrList[] = [];
      for (const permission of perms) {
        const urlSchema = `${getCsURL}/get/${permission.schema_id}`;
        const resSchema = await fetch(urlSchema);
        const jsonSchema = await resSchema.json();
        if (!resSchema.ok){
          const { error, code } = jsonSchema as ApiErrorResponse;
          setError(`Error ${code}: ${error}`);
          return;
        } 
        const respSchema = jsonSchema as ResponseWrappedSchema;
        const { tr_id } = respSchema.schema;
        const trKey = String(tr_id);
        const trSeen = seenTrIds.get(trKey);
        if (trSeen != undefined){
          const perms = trSeen.split(",").filter(Boolean);
          if (!perms.includes(permission.type)) perms.push(permission.type);
          seenTrIds.set(trKey, perms.join(","));
          continue;
        }
        seenTrIds.set(trKey, permission.type);

        const urlTr = `${getTrURL}/get/${tr_id}`;
        const resTr = await fetch(urlTr);
        const jsonTr = await resTr.json();
        if (!resTr.ok){
          const { error, code } = jsonTr as ApiErrorResponse;
          setError(`Error ${code}: ${error}`);
          return;
        } 
        const trEntry = (jsonTr as ResponseWrappedTr).trust_registry;
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