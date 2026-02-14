'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { TrustRegistriesPermission } from '@/ui/dataview/datasections/perm';

export function usePendingFlatPermissions(address?: string) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;

  const [permissionsList, setPermissionsList] = useState<TrustRegistriesPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorPermissionsList, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (addressOverride?: string) => {
    const addressToUse = addressOverride ?? address;

    if (!addressToUse || !getURL) {
      setPermissionsList([]);
      setLoading(false);
      return;
    }

    setError(null);

    const url =
      `${getURL}/pending/flat?account=${addressToUse}`;

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
  }, [address, getURL]);

  useEffect(() => {
    if (!address) return;
    fetchPermissions(address);
  }, [address, fetchPermissions]);

  return { permissionsList, loading, errorPermissionsList, refetch: fetchPermissions };
}