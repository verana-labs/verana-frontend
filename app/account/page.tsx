'use client';

import { useEffect, useState } from 'react';
import DataView from '@/ui/common/data-view-columns';
import { formatNetwork, formatVNA } from '@/util/util';
import TitleAndButton from '@/ui/common/title-and-button';
import { useNotification } from '@/providers/notification-provider';
import { useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountData, accountSections } from '@/ui/dataview/datasections/account';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { RefreshState } from '@/msg/util/signerUtil';
import { useIndexerEvents } from '@/providers/indexer-events-provider';

export default function AccountPage() {
  const searchParams = useSearchParams();
  // Only pre-open the "getVNA" action if the URL includes ?getVNA=true
  const openGetVNA = searchParams.get("getVNA") === "true";

  // Custom hook to fetch account/trust deposit data
  const { accountData, errorAccountData, refetch: refetchAD } = useTrustDepositAccountData();
  const router = useRouter();
  const [errorNotified, setErrorNotified] = useState(false);
  // Notification context for showing error messages
  const { notify } = useNotification();

  // Refresh account/trust deposit data
  const [ refreshState, setRefreshState ] = useState<RefreshState>({});
  const { latestProcessedHeight } = useIndexerEvents();
  
  useEffect(() => {
    if (refreshState.txHeight == null) return;
    console.info("AccountPage", {txHeight: refreshState.txHeight, latestProcessedHeight, 'ss.mmm': new Date().toISOString().slice(17, 23)});
    if (latestProcessedHeight < refreshState.txHeight) return;
    (async () => {
      await refetchAD();
      setRefreshState({});
    })();
  }, [refreshState.txHeight, latestProcessedHeight]);

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
        onRefresh={(id?: string, txHeight?: number) => {
                    setRefreshState({id, txHeight});
                  }}
        activeActionField={openGetVNA ? "getVNA" : undefined}
      />
    </>
  );
}
