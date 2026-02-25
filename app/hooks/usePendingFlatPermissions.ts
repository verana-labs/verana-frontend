'use client';

import { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { TrustRegistriesPermission } from '@/ui/dataview/datasections/perm';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

export function usePendingFlatPermissions() {
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;

  const [permissionsList, setPermissionsList] = useState<TrustRegistriesPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorPermissionsList, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {

    if (!address || !getURL) {
      setError(resolveTranslatable({key: "error.fetch.perm"}, translate)?? 'Missing address or endpoint URL');
      return;
    }

    setError(null);

    const url =
      `${getURL}/pending/flat?account=${address}`;

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }

      const list: TrustRegistriesPermission[] = Array.isArray(json) ? json : (json.trust_registries ?? []);
      setPermissionsList(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!address) return;
    fetchPermissions();
  },[address, getURL]);

  return { permissionsList, loading, errorPermissionsList, refetch: fetchPermissions };
}