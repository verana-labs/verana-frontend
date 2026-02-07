'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { Permission } from '@/ui/dataview/datasections/perm';

export function usePermissions(schema?: string, type?: string, validatorId?: string) {
  const getURL = useMemo(
    () =>
      env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') ||
      process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM ||
      '',
    []
  );

  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorPermissionsList, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (schemaOverride?: string, typeOverride?: string, validatorIdOverride?: string) => {
    const schemaToUse = schemaOverride ?? schema;
    const typeToUse = typeOverride ?? type;
    const validatorIdToUse = validatorIdOverride ?? validatorId;

    if (!schemaToUse || !getURL) {
      setPermissionsList([]);
      setLoading(false);
      return;
    }

    setError(null);

    const params = new URLSearchParams();
    params.set('schema_id', schemaToUse); // incluido siempre
    if (typeToUse) params.set('type', typeToUse);
    if (validatorIdToUse) params.set('validator_perm_id', validatorIdToUse);
    const url = `${getURL}/list?${params.toString()}`;

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
  }, [schema, type, getURL]);

  useEffect(() => {
    if (!schema) return;
    fetchPermissions(schema, type);
  }, [schema, type, fetchPermissions]);

  return { permissionsList, loading, errorPermissionsList, refetch: fetchPermissions };
}