'use client';

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
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
  const veranaChain = useVeranaChain();
  const chainName = veranaChain.chain_name;
  const chainId = veranaChain.chain_id;
  const { getStargateClient, status, isWalletConnected, address, wallet } = useChain(chainName);

  const getURL =
    env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS') ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS;

  const [metrics, setMetrics] = useState<MetricsApiResponse | null>(null);
  const [blockHeight, setBlockHeight] = useState<string>("");
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
      setMetrics(json as MetricsApiResponse);
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

  // Poll block height every 5s when wallet connected
  useEffect(() => {
    if (!isWalletConnected) {
      setBlockHeight("");
      return;
    }
    const fetchHeight = async () => {
      if (getStargateClient) {
        const client = await getStargateClient();
        const block = await client.getBlock();
        setBlockHeight(String(block.header.height.toLocaleString(undefined)));
      }
    };
    fetchHeight();
    const interval = setInterval(fetchHeight, 5000);
    return () => clearInterval(interval);
  }, [getStargateClient, isWalletConnected]);

  // Derive dashboardData from independent state slices
  const dashboardData: DashboardData = {
    chainName: isWalletConnected ? `${chainName} (${chainId})` : null,
    blockHeight,
    status,
    isWalletConnected: String(isWalletConnected),
    address: address ? String(address) : null,
    walletPrettyName: wallet ? wallet.prettyName : null,
    ecosystems: metrics ? Number(metrics.active_trust_registries).toLocaleString() : null,
    schemas: metrics ? Number(metrics.active_schemas).toLocaleString() : null,
    totalLockedTrustDeposit: metrics ? `${Number(metrics.weight).toLocaleString()} VNA` : null,
    issuedCredentials: metrics ? Number(metrics.issued).toLocaleString() : null,
    verifiedCredentials: metrics ? Number(metrics.verified).toLocaleString() : null,
  };

  return {
    dashboardData,
    loading,
    errorDashboardData,
    isWalletConnected,
    refetch: fetchMetrics,
  };
}
