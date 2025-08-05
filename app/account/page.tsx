'use client';

import React, { useEffect, useState } from 'react';
import DataView from '@/app/ui/common/data-view-columns';
import { accountSections, type AccountData } from '@/app/types/dataViewTypes';
import { formatVNA } from '@/app/util/util';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { useNotification } from '@/app/ui/common/notification-provider';
import { useTrustDepositAccountData } from '@/app/hooks/useTrustDepositAccountData';

export default function Page() {
  // Custom hook to fetch account/trust deposit data
  const { accountData, errorAccountData } = useTrustDepositAccountData();

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

  // Notification context for showing error messages
  const { notify } = useNotification();

  useEffect(() => {
    if (accountData) {
      // Prepare constants and process fields for the UI
      const getVNA = "GetVNATrustDeposit";
      // Only enable claim actions if value > 0
      const claimInterests =
        Number(accountData.claimableInterests) >= 0 ? "MsgReclaimTrustDepositYield" : null;
      const reclaimDeposit =
        Number(accountData.reclaimable) >= 0 ? "MsgReclaimTrustDeposit" : null;

      setData({
        balance: formatVNA(accountData.balance, 6),
        totalTrustDeposit: formatVNA(accountData.totalTrustDeposit, 6),
        claimableInterests: formatVNA(accountData.claimableInterests, 6),
        reclaimable: formatVNA(accountData.reclaimable, 6),
        message: accountData.message,
        getVNA,
        claimInterests,
        reclaimDeposit,
      });
    }
    // Show a notification if an error occurred
    if (errorAccountData) {
      notify(errorAccountData, 'error', 'Error fetching trust deposit');
    }
    // Show a notification if message
    if (accountData.message) {
      notify(accountData.message, 'info', 'Message trust deposit');
    }
  }, [accountData, errorAccountData, notify]);

  return (
    <>
      <TitleAndButton title="Account" />
      <DataView<AccountData>
        sections={accountSections}
        data={data}
        columnsCount={3}
        columnsCountMd={2}
      />
    </>
  );
}
