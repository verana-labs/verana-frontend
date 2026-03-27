'use client';

import { useEffect, useState } from 'react';
import DataView from '@/ui/common/data-view-columns';
import TitleAndButton from '@/ui/common/title-and-button';
import { useSearchParams } from 'next/navigation';
import { AccountData, accountSections } from '@/ui/dataview/datasections/account';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { RefreshState } from '@/msg/util/signerUtil';
import { useIndexerEvents } from '@/providers/indexer-events-provider';
import { useAccountCtx } from '@/providers/api-rest-query-provider-context';

export default function AccountPage() {
  const searchParams = useSearchParams();
  // Only pre-open the "getVNA" action if the URL includes ?getVNA=true
  const openGetVNA = searchParams.get("getVNA") === "true";

  // Custom hook to fetch account/trust deposit data
  const accountCtx = useAccountCtx();
  
  // Refresh account/trust deposit data
  const [ refresh, setRefresh ] = useState<boolean>(true);
  const [ refreshState, setRefreshState ] = useState<RefreshState>({});
  const { latestProcessedHeight } = useIndexerEvents();

  useEffect(() => {
    if (!refresh) return;
    (async () => {
      await accountCtx.refetch();
      setRefresh(false);
    })();
  }, [refresh]);
  
  useEffect(() => {
    if (refreshState.txHeight == null) return;
    console.info("AccountPage", {txHeight: refreshState.txHeight, latestProcessedHeight, 'ss.mmm': new Date().toISOString().slice(17, 23)});
    if (latestProcessedHeight < refreshState.txHeight) return;
    setRefresh(true);
  }, [refreshState.txHeight, latestProcessedHeight]);

  // State for processed account data to display in DataView
  const [data, setData] = useState<AccountData>();

  useEffect(() => {
    if (accountCtx.accountData) {
      // Prepare constants and process fields for the UI
      const accountData = accountCtx.accountData as AccountData;
      const claimableInterests = Number(accountData.claimableInterests) > 0 ? accountData.claimableInterests : null;
      const getVNA = "GetVNATrustDeposit";
      const claimInterests = "MsgReclaimTrustDepositYield";
      setData({
        ... accountData,
        claimableInterests,
        getVNA,
        claimInterests,
        created: "March 15, 2024",
        totalTransactions: 765,
        trustRegistriesJoined: 127,
        didsManaged: 554,
      });
    }
  }, [accountCtx.accountData]);

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({key: "account.title"}, translate)?? "Account"}
        description={[resolveTranslatable({key: "account.desc"}, translate)??""]}
      />
      { data && (
      <DataView<AccountData>
        sectionsI18n={accountSections}
        data={data}
        onRefresh={(id?: string, txHeight?: number) => {
                    setRefreshState({id, txHeight});
                  }}
        activeActionField={openGetVNA ? "getVNA" : undefined}
        loading={loading}
      />
      )}
    </>
  );
}
