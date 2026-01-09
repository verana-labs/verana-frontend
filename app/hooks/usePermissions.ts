'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { ApiErrorResponse } from '@/types/apiErrorResponse';
import { Permission } from '@/ui/dataview/datasections/perm';
import { Role } from '@/ui/common/role-card';

export function usePermissions(schema?: string, type?: Role) {
  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM;

  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorPermissionsList, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (schemaOverride?: string, typeOverride?: Role) => {
    const schemaToUse = schemaOverride ?? schema;
    const typeToUse = typeOverride ?? type;

    if (!schemaToUse || !getURL) {
      setPermissionsList([]);
      setLoading(false);
      return;
    }

    setError(null);
    // setPermissionsList([]);

    const url =
      `${getURL}/list?schema_id=${encodeURIComponent(schemaToUse)}` +
      (typeToUse ? `&type=${encodeURIComponent(typeToUse)}` : "");

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