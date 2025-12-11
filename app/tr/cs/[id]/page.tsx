'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DataView from '@/ui/common/data-view-columns';
import TitleAndButton from '@/ui/common/title-and-button';
import EditableDataView from '@/ui/common/data-edit';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { CsData } from '@/types/dataViewTypes';
import { useCsData } from '@/hooks/useCredentialSchemaData';
import { csSections } from '@/ui/dataview/datasections/cs';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { DataType, getMsgTypeFor } from '@/msg/constants/msgTypeForDataType';

export default function CSViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const qParams = useSearchParams();
  const isEdit = qParams.get('edit')=='true';

  const [data, setData] = useState<CsData | null>(null);
  const [editing, setEditing] = useState(false);

  const msgType = getMsgTypeFor("CsData" as DataType, "update");
  const { submitTx } = useSubmitTxMsgTypeFromObject( () => setEditing(false), () => setRefresh(true) );
  
  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data);
    setEditing(false);
  }

  // const veranaChain = useVeranaChain();
  // const { address } = useChain(veranaChain.chain_name);
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
    setData(csData);
  }, [csData]);

  if (loading && !refresh) {
    return <div className="loading-paner">{resolveTranslatable({key: "loading.cs"}, translate)?? "Loading Credential Schema details..."}</div>;
  }
  if (errorCS || !data) {
    return <div className="error-pane">{errorCS || (resolveTranslatable({key: "error.cs.notfound"}, translate)?? 'Credential Schema not found')}</div>;
  }

  return (
    <>
      {/* Back Navigation & Back Navigation */}
      <TitleAndButton
        title=  {`${data.title}`}
        buttonLabel={resolveTranslatable({key: "button.cs.back"}, translate)}
        to={`/tr/${encodeURIComponent(data.trId)}`}
        icon={faArrowLeft}
        backLink= {true}
        description={[`${data.description}`]}
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
        onEdit={ isEdit? () => setEditing(true) : undefined } 
        // onRefresh={setRefresh}
        />
      )}
    </>
  );
}
