'use client'

import { DidData, didSections } from '@/ui/dataview/datasections/did';
import DataView from '@/ui/common/data-view-columns';
import TitleAndButton from '@/ui/common/title-and-button';
import { useDIDData } from '@/hooks/useDIDData';
import { useEffect, useState, useMemo } from 'react';
import { formatVNA } from '@/util/util';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';

type DIDViewProps = {
  id?: string;
  selectDidData?: DidData;
  onBack?: () => void;
  showHeader?: boolean;
  onRefreshTable?: () => void;
};

export default function DIDView({ id, selectDidData, onBack, showHeader = true, onRefreshTable}: DIDViewProps) {

  // Hook to get connected account data (includes address)
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  // Hook to fetch the DID data (optionally actions if controller matches)
  const { dataDID, errorDIDData, refetch: refetchDID } = useDIDData((id?? selectDidData?.did) ?? "");

  // Refresh data DID
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    if (!refresh) return;
    console.info('useEffect DIDView');
    (async () => {
      await refetchDID();
      // await refetchAD();
      setRefresh(false);
      onRefreshTable?.();
    })();
  }, [refresh]);
  
  // DidData, formatting deposit and setting actions if controller matches
  const data: DidData | null = useMemo(() => {
    // const source: DidData | null = (selectDidData ?? dataDID) ?? null;
    const source: DidData | null = dataDID ?? null;
    if (!source) return null;
    id = source.did;

    // Create a copy of dataDID to avoid mutating the original
    const data = { ...source };

    if (address &&  address === data.controller) {
      data.renewDID = 'MsgRenewDID';
      data.touchDID = 'MsgTouchDID';
      data.removeDID = 'MsgRemoveDID';
    }

    // Return the object with formatted deposit
    return {
      ...data,
      deposit: formatVNA(data.deposit ?? '0', 6),
    };
  }, [selectDidData, dataDID]);
  
  // Show error message if fetch failed or DID not found
  if (errorDIDData || !data) {
    return <div className="p-6 text-red-600">{ errorDIDData || (resolveTranslatable({key: "error.did.notfound"}, translate)?? "DID not found")}</div>;
  }

  // Render the page: Title, button, and DataView for DID info
  return (
    <> 
      {showHeader ? (
        <TitleAndButton
          title={`${resolveTranslatable({key: "did.title"}, translate)?? "DID"}  ${data.did}`}
          buttonLabel={resolveTranslatable({key: "button.did.back"}, translate)?? "Back to Directory"}
          to="/did"
          icon={faChevronLeft}
        />
      ) : null}
      <DataView<DidData>
        sectionsI18n={didSections}
        data={data}
        id={decodeURIComponent(data.did)}
        onRefresh={() => setRefresh(true)}
        onBack={onBack}
      />
    </>
  );
}
