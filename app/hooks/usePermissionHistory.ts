'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { PermissionHistory } from '@/ui/dataview/datasections/perm';

export function usePermissionHistory(id?: string) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;

  const [permissionHistoryList, setPermissionHistoryList] = useState<PermissionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorPermissionsList, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (idOverride?: string) => {
    const idPermission = idOverride ?? id;

    if (!idPermission || !getURL) {
      setPermissionHistoryList([]);
      setLoading(false);
      return;
    }

    setError(null);

    const url =
      `${getURL}/history/${idPermission}`;

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }

      const list: PermissionHistory[] = Array.isArray(json) ? json : (json.history ?? []);
      setPermissionHistoryList(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, getURL]);

  useEffect(() => {
    if (!id) return;
    fetchPermissions(id);
  }, [id, fetchPermissions]);

  return { permissionHistoryList, loading, errorPermissionsList, refetch: fetchPermissions };
}