'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { TrList } from '@/ui/datatable/columnslist/tr';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';

export function useTrustRegistries (all: boolean = false, onlyActive: boolean = true) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name);

  const getTrURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY;

  const [trList, setTrList] = useState<TrList[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorTrList, setError] = useState<string | null>(null);
  
  const fetchTrList = async () => {

    if (!address || !isWalletConnected || !getStargateClient || !getTrURL) {
      setError(resolveTranslatable({key: "error.fetch.tr"}, translate)?? 'Missing address or endpoint URL');
      setLoading(false);
      return;
    }

    // Reset state when inputs change
    setError(null);
    setTrList([]);
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('response_max_size', '1024');
      if ( !all) params.set('participant', address);
      if ( onlyActive ) params.set('only_active', 'true');
      const urlTrList = `${getTrURL}/list?${params.toString()}`;

      const resTrList = await fetch(urlTrList);
      const jsonTrList = await resTrList.json();
      if (!resTrList.ok){
        const { error, code } = jsonTrList as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      } 
      const trListController: TrList[] = Array.isArray(jsonTrList.trust_registries) ? jsonTrList.trust_registries : [];      
      setTrList(trListController);
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