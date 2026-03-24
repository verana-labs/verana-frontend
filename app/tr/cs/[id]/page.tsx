'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DataView from '@/ui/common/data-view-columns';
import TitleAndButton from '@/ui/common/title-and-button';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faChevronRight, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { useCsData } from '@/hooks/useCredentialSchemaData';
import { CsData, csSections } from '@/ui/dataview/datasections/cs';
import { useChain } from '@cosmos-kit/react';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useTrustRegistryData } from '@/hooks/useTrustRegistryData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { shortenDID } from '@/util/util';
import Link from 'next/link';
import { RefreshState } from '@/msg/util/signerUtil';
import { useIndexerEvents } from '@/providers/indexer-events-provider';

export default function CSViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<CsData | null>(null);
  const router = useRouter();
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const [ trController, setTrController ] = useState<boolean>(false);
  const [ trId, setTrId] = useState<string>('');
  const { dataTR, refetch: refetchTR } = useTrustRegistryData(trId);
  const { csData, errorCS, refetch: refetchCS } = useCsData(id);

  useEffect(() => {
    (async () => {
      await refetchTR();
    })();
  }, [trId]);

  useEffect(() => {
    setTrController(dataTR?.controller === address);
  }, [dataTR, address]);

  // Refresh data CS
  const [ refreshState, setRefreshState ] = useState<RefreshState>({});
  const { latestProcessedHeight } = useIndexerEvents();
  
  useEffect(() => {
    if (refreshState.txHeight == null) return;
    console.info("CSViewPage", {txHeight: refreshState.txHeight, latestProcessedHeight, 'ss.mmm': new Date().toISOString().slice(17, 23)});
    if (latestProcessedHeight < refreshState.txHeight) return;
    (async () => {
      await refetchCS();
      setRefreshState({});
    })();
  }, [refreshState.txHeight, latestProcessedHeight]);

  useEffect(() => {
    if (!csData) return;
    setData({
      ...csData,
      archiveCredentialSchema: trController && !csData.archived ? "MsgArchiveCredentialSchema" : undefined,
      unarchiveCredentialSchema: trController && csData.archived ? "MsgUnarchiveCredentialSchema" : undefined,
      updateCredentialSchema: trController ? "MsgUpdateCredentialSchema" : undefined,
    });
    if (trId == "") setTrId(csData.trId as string);
  }, [csData, trController]);

  return (
    <>
      {/* Breadcrumbs */}
      <section className="mb-6">
        <nav className="flex flex-wrap items-center text-sm" aria-label="Breadcrumb">
          <Link
            href={`/tr/${trId}`}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {dataTR && shortenDID(dataTR.did as string)}
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-neutral-70 text-xs" />
          <span className="text-gray-900 dark:text-white font-medium">{csData?.title}</span>
        </nav>
      </section>

      {/* Back Navigation & Back Navigation */}
      <TitleAndButton
        title= {resolveTranslatable({key: "dataview.cs.title"}, translate) ?? "Credential Schema"}
        description={[resolveTranslatable({key: "dataview.cs.description"}, translate)??""]}
      />
      {data ? (
        <>
        {/* Basic Information Section */}
        <DataView<CsData> 
          sectionsI18n={csSections}
          data={data}
          id={id}
          viewEditButton={false}
          onRefresh={(id?: string, txHeight?: number) => {
                      setRefreshState({id, txHeight});
                    }}
          showViewTitle={true}
          generalBorder={true}
          viewTitleButton={ {icon: faSitemap, buttonLabel: resolveTranslatable({key: "participants.title"}, translate)??"participants", onClick: () => router.push(`/participants/${data.id}`)} }
        />
        </>
      ) : errorCS ? (
        <div className="error-pane">
          {errorCS || (resolveTranslatable({ key: 'error.cs.notfound' }, translate) ?? 'Credential Schema not found')}
        </div>
      ) : null }      
    </>
  );
}
