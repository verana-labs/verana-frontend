'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { Permission } from '@/ui/dataview/datasections/perm';

export function usePermission(id?: string) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;

  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorPermission, setError] = useState<string | null>(null);

  const fetchPermission = useCallback(async (idOverride?: string) => {
    const idPermission = idOverride ?? id;

    if (!idPermission || !getURL) {
      setPermission(null);
      setLoading(false);
      return;
    }

    setError(null);

    const url =
      `${getURL}/get/${idPermission}`;

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }

      const perm: Permission = Array.isArray(json) ? json : (json.permission ?? null);
      setPermission(perm);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, getURL]);

  useEffect(() => {
    if (!id) return;
    fetchPermission(id);
  }, [id, fetchPermission]);

  return { permission, loading, errorPermission, refetch: fetchPermission };
}