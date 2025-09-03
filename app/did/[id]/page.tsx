'use client'

import { useParams, useRouter } from 'next/navigation';
import { DidData, didSections } from '@/app/types/dataViewTypes';
import DataView from '@/app/ui/common/data-view-columns';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { useNotification } from '@/app/ui/common/notification-provider';
import { useTrustDepositAccountData } from '@/app/hooks/useTrustDepositAccountData';
import { useDIDData } from '@/app/hooks/useDIDData';
import { useEffect, useState, useMemo } from 'react';
import { formatVNA } from '@/app/util/util';

export default function DidViewPage() {
  const params = useParams();
  const id = params?.id as string;

  // Hook to get connected account data (includes address)
  const { accountData, errorAccountData } = useTrustDepositAccountData();
  const { notify } = useNotification();
  const router = useRouter();
  const [errorNotified, setErrorNotified] = useState(false);

  // Hook to fetch the DID data (optionally actions if controller matches)
  const { dataDID, loading, errorDIDData } = useDIDData(id);

  // Notify and redirect if there is an error fetching account data
  useEffect(() => {
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', 'Error fetching account balance');
        setErrorNotified(true);
        router.push('/did');
      })();
    }
  }, [errorAccountData, router, errorNotified]);

  // DidData, formatting deposit and setting actions if controller matches
  const data: DidData | null = useMemo(() => {
    if (!dataDID) return null;

    // Create a copy of dataDID to avoid mutating the original
    const data = { ...dataDID };

    if (accountData.address &&  accountData.address === data.controller) {
      data.renewDID = 'MsgRenewDID';
      data.touchDID = 'MsgTouchDID';
      data.removeDID = 'MsgRemoveDID';
    }

    // Return the object with formatted deposit
    return {
      ...data,
      deposit: formatVNA(data.deposit, 6),
    };
  }, [dataDID, accountData.address]);
  
  // Wait until accountData.address exists before loading the DID info
  if (!accountData?.address) {
    return <div className="p-6 text-center">Loading wallet address…</div>;
  }
  // Show loading spinner/message while fetching DID details
  if (loading) {
    return <div className="p-6 text-center">Loading DID details…</div>;
  }
  // Show error message if fetch failed or DID not found
  if (errorDIDData || !data) {
    return <div className="p-6 text-red-600">Error: {errorDIDData || 'DID not found'}</div>;
  }

  // Render the page: Title, button, and DataView for DID info
  return (
    <>
      <TitleAndButton
        title={`DID ${data.did}`}
        buttonLabel="Back to Directory"
        to="/did"
        Icon={ChevronLeftIcon}
      />
      <DataView<DidData>
        sections={didSections}
        data={data}
        id={decodeURIComponent(id)}
        columnsCount={2}
      />
    </>
  );
}
