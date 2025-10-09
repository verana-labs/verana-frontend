'use client';

import { useState, useEffect } from "react";
import { env } from "next-runtime-env";
import { useVeranaChain } from "@/app/hooks/useVeranaChain";
import { useChain } from "@cosmos-kit/react";

type TrustDepositAccountData = {
  address: string | null;
  balance: string | null;
  totalTrustDeposit: string | null;
  claimableInterests: string | null;
  reclaimable: string | null;
  message: string | null;
};

/**
 * Hook to fetch and format trust deposit account data for the connected wallet.
 * Returns: { data, loading, error, address, isWalletConnected }
 */
export function useTrustDepositAccountData(
) {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name);

  const getAccountURL =
    env("NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT") ||
    process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT;

  const [accountData, setData] = useState<TrustDepositAccountData>({
    address: null,
    balance: null,
    totalTrustDeposit: null,
    claimableInterests: null,
    reclaimable: null,
    message: null,
  });
  const [loading, setLoading] = useState(false);
  const [errorAccountData, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!address || !isWalletConnected || !getStargateClient || !getAccountURL) return;
    setLoading(true);
    setError(null);

    let balance = null;
    let totalTrustDeposit = null;
    let claimableInterests = null;
    let reclaimable = null;
    let message = null;

    try {
      const client = await getStargateClient();
      const balInfo = await client.getBalance(address, "uvna");
      balance = balInfo.amount;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    try {
      const resp = await fetch(`${getAccountURL}/get/${address}`);
      const json = await resp.json();
      if (json.trust_deposit) {
        totalTrustDeposit = json.trust_deposit.amount;
        claimableInterests = "0";
        reclaimable = json.trust_deposit.claimable;
      } else if (json.message) {
        message = json.message;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setData({
      address,
      balance,
      totalTrustDeposit,
      claimableInterests,
      reclaimable,
      message,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    accountData,
    loading,
    errorAccountData,
    address,
    isWalletConnected,
    refetch: fetchData
  };
}
