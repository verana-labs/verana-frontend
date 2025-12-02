'use client';

import React, { useEffect, useState } from 'react';
import DataView from '@/ui/common/data-view-columns';
import { formatVNA } from '@/util/util';
import TitleAndButton from '@/ui/common/title-and-button';
import { useNotification } from '@/ui/common/notification-provider';
import { useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData';
import { useRouter } from 'next/navigation';
import { AccountData, accountSections } from '@/ui/dataview/datasections/account';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

export default function AccountPage() {
  // Custom hook to fetch account/trust deposit data
  const { accountData, errorAccountData, refetch: refetchAD } = useTrustDepositAccountData();
  const router = useRouter();
  const [errorNotified, setErrorNotified] = useState(false);
  // Notification context for showing error messages
  const { notify } = useNotification();

  // Refresh account/trust deposit data
  const [refresh, setRefresh] = useState<boolean>(false);
  useEffect(() => {
    if (!refresh) return;
    (async () => {
      await refetchAD();
      setRefresh(false);
    })();
  }, [refresh]);

  // State for processed account data to display in DataView
  const [data, setData] = useState<AccountData>({
    balance: null,
    totalTrustDeposit: null,
    claimableInterests: null,
    reclaimable: null,
    message: null,
    getVNA: undefined,
    claimInterests: undefined,
    reclaimDeposit: undefined,
  });


  // Notify and redirect if there is an error fetching account data
  useEffect(() => {
    // Show a notification if an error occurred
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', resolveTranslatable({key: "error.fetch.td.title"}, translate)?? 'Error fetching trust deposit');
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
        Number(accountData.claimableInterests) > 0 ? "MsgReclaimTrustDepositYield" : undefined;
      const reclaimDeposit =
        Number(accountData.reclaimable) > 0 ? "MsgReclaimTrustDeposit" : undefined;
      
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
      <TitleAndButton title={resolveTranslatable({key: "account.title"}, translate)?? "Account"}/>
      <DataView<AccountData>
        sectionsI18n={accountSections}
        data={data}
        columnsCount={3}
        columnsCountMd={2}
        onRefresh={() => setRefresh(true)}
      />
    </>
  );
}
