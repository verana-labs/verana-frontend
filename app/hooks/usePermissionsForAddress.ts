'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { Permission } from '@/ui/dataview/datasections/perm';

export function usePermissionsForAddress(address?: string) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;

  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
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
    // setPermissionsList([]);

    const url =
      `${getURL}/list?grantee=${addressToUse}`;

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }

      const list: Permission[] = Array.isArray(json) ? json : (json.permissions ?? []);
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