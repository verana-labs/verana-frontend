'use client';

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { DashboardData } from '@/ui/dataview/datasections/dashboard';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { ApiErrorResponse } from '@/types/apiErrorResponse';

type MetricsApiResponse = {
  participants: number;
  active_trust_registries: number;
  archived_trust_registries: number;
  active_schemas: number;
  archived_schemas: number;
  weight: number;
  issued: number;
  verified: number;
  ecosystem_slash_events: number;
  ecosystem_slashed_amount: number;
  ecosystem_slashed_amount_repaid: number;
  network_slash_events: number;
  network_slashed_amount: number;
  network_slashed_amount_repaid: number;
};

export function useDashboardData() {

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS;

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorDashboardData, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      if (!getURL) {
        setError(
          resolveTranslatable({ key: 'error.fetch.metrics' }, translate) ??
            'Missing metrics endpoint URL'
        );
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await fetch(`${getURL}/all`);
      const json = await res.json();
      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse;
        setError(`Error ${code}: ${error}`);
        return;
      }
      const entry = json as MetricsApiResponse;
      setDashboardData({
        ecosystems: entry.active_trust_registries,
        schemas: entry.active_schemas,
        totalLockedTrustDeposit: entry.weight,
        issuedCredentials: entry.issued,
        verifiedCredentials: entry.verified,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, []);


  return {
    dashboardData,
    loading,
    errorDashboardData,
    refetch: fetchMetrics,
  };
}
