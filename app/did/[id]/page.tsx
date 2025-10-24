'use client'

import { useParams, useRouter } from 'next/navigation';
import { DidData, didSections } from '@/ui/dataview/datasections/did';
import DataView from '@/ui/common/data-view-columns';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/ui/common/title-and-button';
import { useNotification } from '@/ui/common/notification-provider';
import { useTrustDepositAccountData } from '@/hooks/useTrustDepositAccountData';
import { useDIDData } from '@/hooks/useDIDData';
import { useEffect, useState, useMemo } from 'react';
import { formatVNA } from '@/util/util';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

export default function DIDViewPage() {
  const params = useParams();
  const id = params?.id as string;

  // Hook to get connected account data (includes address)
  const { accountData, errorAccountData, refetch: refetchAD } = useTrustDepositAccountData();
  const { notify } = useNotification();
  const router = useRouter();
  const [errorNotified, setErrorNotified] = useState(false);

  // Hook to fetch the DID data (optionally actions if controller matches)
  const { dataDID, loading, errorDIDData, refetch: refetchDID } = useDIDData(id);

  // Refresh data DID
  const [refresh, setRefresh] = useState<string | null>(null);
  useEffect(() => {
    if (!refresh) return;
    (async () => {
      await refetchDID();
      await refetchAD();
      setRefresh(null);
    })();
  }, [refresh]);
  
  // Notify and redirect if there is an error fetching account data
  useEffect(() => {
    if (errorAccountData && !errorNotified) {
      (async () => {
        await notify(errorAccountData, 'error', resolveTranslatable({key: "error.fetch.account.title"}, translate)?? 'Error fetching account balance');
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
      deposit: formatVNA(data.deposit ?? '0', 6),
    };
  }, [dataDID, accountData.address]);
  
  if (!refresh) {
    // Wait until accountData.address exists before loading the DID info
    if (!accountData?.address) {
      return <div className="p-6 text-center">{resolveTranslatable({key: "loading.accountdata"}, translate)?? "Loading account data..."}</div>;
    }
    // Show loading spinner/message while fetching DID details
    if (loading) {
      return <div className="p-6 text-center">{resolveTranslatable({key: "loading.did"}, translate)?? "Loading DID details..."}</div>;
    }
  }

  // Show error message if fetch failed or DID not found
  if (errorDIDData || !data) {
    return <div className="p-6 text-red-600">{ errorDIDData || (resolveTranslatable({key: "error.did.notfound"}, translate)?? "DID not found")}</div>;
  }

  // Render the page: Title, button, and DataView for DID info
  return (
    <>
      <TitleAndButton
        title={`${resolveTranslatable({key: "did.title"}, translate)?? "DID"}  ${data.did}`}
        buttonLabel={resolveTranslatable({key: "button.did.back"}, translate)?? "Back to Directory"}
        to="/did"
        Icon={ChevronLeftIcon}
      />
      <DataView<DidData>
        sectionsI18n={didSections}
        data={data}
        id={decodeURIComponent(id)}
        columnsCount={2}
        setRefresh={setRefresh}
      />
    </>
  );
}
