'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DataView from '@/ui/common/data-view-columns';
import TitleAndButton from '@/ui/common/title-and-button';
import EditableDataView from '@/ui/common/data-edit';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faChevronRight, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { useCsData } from '@/hooks/useCredentialSchemaData';
import { CsData, csSections } from '@/ui/dataview/datasections/cs';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { DataType, getMsgTypeFor } from '@/msg/constants/msgTypeForDataType';
import { useChain } from '@cosmos-kit/react';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useTrustRegistryData } from '@/hooks/useTrustRegistryData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { shortenDID } from '@/util/util';

export default function CSViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const qParams = useSearchParams();
  const tr =qParams.get('tr');

  const [data, setData] = useState<CsData | null>(null);
  const [editing, setEditing] = useState(false);

  const msgType = getMsgTypeFor("CsData" as DataType, "update");
  const { submitTx } = useSubmitTxMsgTypeFromObject( () => setEditing(false), () => setRefresh(true) );
  
  const router = useRouter();
  
  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data);
    setEditing(false);
  }

  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);
  const [ trController, setTrController ] = useState<boolean>(false);
  const { dataTR } = useTrustRegistryData(tr??'');
  useEffect(() => {
    setTrController(dataTR?.controller === address);
  }, [dataTR, address]);

  const { csData, loading, errorCS, refetch: refetchCS } = useCsData(id);

  // Refresh data TR
  const [refresh, setRefresh] = useState<boolean>(false);
  useEffect(() => {
    if (!refresh) return;
    console.info('useEffect CSViewPage');
    (async () => {
      await refetchCS();
      setRefresh(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (!csData) return;
    setData({
      ...csData,
      archiveCredentialSchema: trController && !csData.archived ? "MsgArchiveCredentialSchema" : undefined,
      unarchiveCredentialSchema: trController && csData.archived ? "MsgUnarchiveCredentialSchema" : undefined,
      updateCredentialSchema: trController ? "MsgUpdateCredentialSchema" : undefined,
    });
  }, [csData, trController]);

  if (loading && !refresh) {
    return <div className="loading-paner">{resolveTranslatable({key: "loading.cs"}, translate)?? "Loading Credential Schema details..."}</div>;
  }
  if (errorCS || !data) {
    return <div className="error-pane">{errorCS || (resolveTranslatable({key: "error.cs.notfound"}, translate)?? 'Credential Schema not found')}</div>;
  }

  return (
    <>
      {/* Breadcrumbs */}
      <section className="mb-6">
        <nav className="flex flex-wrap items-center text-sm" aria-label="Breadcrumb">
          <a
            href={`/tr/${tr}`}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {dataTR && shortenDID(dataTR.did as string)}
          </a>
          <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-neutral-70 text-xs" />
          <span className="text-gray-900 dark:text-white font-medium">{csData?.title}</span>
        </nav>
      </section>

      {/* Back Navigation & Back Navigation */}
      <TitleAndButton
        title= {resolveTranslatable({key: "dataview.cs.title"}, translate) ?? "Credential Schema"}
        description={[resolveTranslatable({key: "dataview.cs.description"}, translate)??""]}
        // buttonLabel={resolveTranslatable({key: "button.cs.back"}, translate)}
        // to={`/tr/${encodeURIComponent(data.trId)}`}
        // icon={faArrowLeft}
        // backLink= {true}
      />
      {/* Basic Information Section */}
      {editing ? (
      <EditableDataView<CsData>
        sectionsI18n={csSections}
        data={data}
        messageType={msgType}
        id={id}
        onSave={ onSave }
        onCancel={() => setEditing(false)}  />
      ) : (
      <DataView<CsData> 
        sectionsI18n={csSections}
        data={data}
        id={id}
        viewEditButton={false}
        onEdit={ trController? () => setEditing(true) : undefined } 
        onRefresh={()=>setRefresh(true)}
        showViewTitle={true}
        generalBorder={true}
        viewTitleButton={ {icon: faSitemap, buttonLabel: resolveTranslatable({key: "participants.title"}, translate)??"participants", onClick: () => router.push(`/participants/${data.id}`)} }
      />
      )}
    </>
  );
}
