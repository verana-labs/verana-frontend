'use client';

import React, { useEffect, useState } from 'react';
import DataView from '@/app/ui/common/data-view-columns';
import { accountSections, type AccountData } from '@/app/types/dataViewTypes';
import { formatVNA } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { useNotification } from '@/app/ui/common/notification-provider';
import { useTrustDepositAccountData } from '@/app/hooks/useTrustDepositAccountData';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  // Custom hook to fetch account/trust deposit data
  const { accountData, errorAccountData, refetch: refetchAD } = useTrustDepositAccountData();
  const router = useRouter();
  const [errorNotified, setErrorNotified] = useState(false);
  // Notification context for showing error messages
  const { notify } = useNotification();

  // Refresh account/trust deposit data
  const [refresh, setRefresh] = useState<string | null>(null);
  useEffect(() => {
    if (!refresh) return;
    (async () => {
      await refetchAD();
      setRefresh(null);
    })();
  }, [refresh]);

  // State for processed account data to display in DataView
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


  // Notify and redirect if there is an error fetching account data
  useEffect(() => {
    // Show a notification if an error occurred
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', 'Error fetching trust deposit');
        setErrorNotified(true);
        router.push('/');
      })();
    }
  }, [errorAccountData, router, errorNotified]);

  useEffect(() => {
    if (accountData) {
      // Prepare constants and process fields for the UI
      const getVNA = "GetVNATrustDeposit";
      // Only enable claim actions if value > 0
      const claimInterests =
        Number(accountData.claimableInterests) > 0 ? "MsgReclaimTrustDepositYield" : null;
      const reclaimDeposit =
        Number(accountData.reclaimable) > 0 ? "MsgReclaimTrustDeposit" : null;
      
      if (accountData.message){
        setData({
          balance: formatVNA(accountData.balance, 6),
          totalTrustDeposit: null,
          claimableInterests: null,
          reclaimable: null,
          message: accountData.message,
          getVNA,
          claimInterests,
          reclaimDeposit,
        });
      }
      else{
        setData({
          balance: formatVNA(accountData.balance, 6),
          totalTrustDeposit: formatVNA(accountData.totalTrustDeposit, 6),
          claimableInterests: formatVNA(accountData.claimableInterests, 6),
          reclaimable: formatVNA(accountData.reclaimable, 6),
          message: null,
          getVNA,
          claimInterests,
          reclaimDeposit,
        });
      }
    }
  }, [accountData]);

  return (
    <>
      <TitleAndButton title="Account" />
      <DataView<AccountData>
        sections={accountSections}
        data={data}
        columnsCount={3}
        columnsCountMd={2}
        setRefresh={setRefresh}
      />
    </>
  );
}
