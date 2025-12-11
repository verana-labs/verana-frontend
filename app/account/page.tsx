'use client';

import React, { useEffect, useState } from 'react';
import DataView from '@/ui/common/data-view-columns';
import { formatNetwork, formatVNA } from '@/util/util';
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
    address: null,
    network: null,
    created: "March 15, 2024",
    totalTransactions: 765,
    trustRegistriesJoined: 127,
    didsManaged: 554
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
      const claimInterests = "MsgReclaimTrustDepositYield";
        // Number(accountData.claimableInterests) > 0 ? "MsgReclaimTrustDepositYield" : undefined;
      
      if (accountData.message){
        setData({
          ... data,
          balance: formatVNA(accountData.balance, 6),
          message: accountData.message,
          getVNA,
          claimInterests,
          address: accountData.address,
          network: formatNetwork(accountData.network??"")
        });
      }
      else{
        setData({
          ... data,
          balance: formatVNA(accountData.balance, 6),
          totalTrustDeposit: formatVNA(accountData.totalTrustDeposit, 6),
          claimableInterests: Number(accountData.claimableInterests) > 0 ? formatVNA(accountData.claimableInterests, 6) : null,
          reclaimable: formatVNA(accountData.reclaimable, 6),
          message: null,
          getVNA,
          claimInterests,
          address: accountData.address,
          network: formatNetwork(accountData.network??"")
      });
      }
    }
  }, [accountData]);

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({key: "account.title"}, translate)?? "Account"}
        description={[resolveTranslatable({key: "account.desc"}, translate)??""]}
      />
      <DataView<AccountData>
        sectionsI18n={accountSections}
        data={data}
        onRefresh={() => setRefresh(true)}
      />
    </>
  );
}
