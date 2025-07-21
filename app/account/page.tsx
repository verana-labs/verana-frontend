'use client';

import React, { useEffect, useState } from 'react';
import DataView from '@/app/ui/common/data-view-columns';
import { useChain } from '@cosmos-kit/react';
import { useVeranaChain } from "@/app/config/useVeranaChain";
import { accountSections, type AccountData } from '@/app/types/DataViewTypes';
import { formatVNA } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { env } from 'next-runtime-env';
import { useNotification } from '@/app/ui/common/notification-provider';

export default function Page() {
  const veranaChain = useVeranaChain();
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name);
  const [data, setData] = useState<AccountData>({
    balance: null,
    totalTrustDeposit: null,
    claimableInterests: null,
    reclaimable: null,
    message: null,
    getVNA: null,
    claimInterests: null,
    reclaimDeposit: null,
  });

  const getAccountURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT_GET_ACCOUNT') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_GET_ACCOUNT;
  const { notify } = useNotification();
  
  useEffect(() => {
    if (!isWalletConnected || !address || !getStargateClient) return;

    const fetchData = async () => {
      let balance = null;
      let totalTrustDeposit = null;
      let claimableInterests = null;
      let reclaimable = null;
      let message = null;
      const getVNA = "GetVNATrustDeposit";
      const claimInterests = "ClaimInterestsTrustDeposit";
      const reclaimDeposit = "ReclaimDepositTrustDeposit";

      try {
        const client = await getStargateClient();
        const balInfo = await client.getBalance(address, 'uvna');
        balance = formatVNA(balInfo.amount, 6);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          'Error fetching balance'
        );
      }

      try {
        if (getAccountURL) {
          const resp = await fetch(`${getAccountURL}/${address}`);
          const json = await resp.json();
          if (json.trust_deposit) {
            totalTrustDeposit = formatVNA(json.trust_deposit.amount, 6);
            claimableInterests = formatVNA('0', 6);
            reclaimable = formatVNA(json.trust_deposit.claimable, 6);
          } else if (json.message) {
            message = json.message;
          }
        } else {
          notify(
            'URL getAccount error.',
            'error',
            'Error fetching trust deposit'
          );
        }
      } catch (err) {
        notify(
          err instanceof Error ? err.message : String(err),
          'error',
          'Error fetching trust deposit'
        );
      }

      setData({
        balance,
        totalTrustDeposit,
        claimableInterests,
        reclaimable,
        message,
        getVNA,
        claimInterests,
        reclaimDeposit,
      });
    };

    fetchData();
  }, [address, isWalletConnected, getStargateClient]);

  return (
    <>
      <TitleAndButton title="Account" />
      <DataView<AccountData>
        sections={accountSections}
        data={data}
        id=""
        columnsCount={3}
        columnsCountMd={2}
      />
    </>
  );
}
