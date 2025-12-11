'use client';

import React from 'react';
import { CsData, csSections } from '@/ui/dataview/datasections/cs';
import EditableDataView from '@/ui/common/data-edit';
import { DataType, getMsgTypeFor } from '@/msg/constants/msgTypeForDataType';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

type AddCsPageProps = {
  trId: number;
  onCancel: () => void;
  onRefresh: () => void;
}

export default function AddCsPage({ trId, onCancel, onRefresh }: AddCsPageProps) {
  const msgType = getMsgTypeFor("CsData" as DataType, "create");
  const { submitTx } = useSubmitTxMsgTypeFromObject( onCancel, onRefresh );

  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data);
  }

  const newCS = {
    trId: trId, creator: '',
    issuerGrantorValidationValidityPeriod: 0, verifierGrantorValidationValidityPeriod: 0,
    issuerValidationValidityPeriod: 0, verifierValidationValidityPeriod: 0, holderValidationValidityPeriod: 0,
    issuerPermManagementMode: 1, verifierPermManagementMode: 1, jsonSchema: "",
    title: resolveTranslatable({key: "tr.cs.add.title"}, translate), id: ''
  };

  return (
    <>
      {/* Editable form */}
      <EditableDataView<CsData>
        sectionsI18n={csSections}
        id={undefined}
        messageType={'MsgCreateCredentialSchema'}     
        data={newCS}
        onSave={onSave}
        onCancel={onCancel}
        isModal={true}
      />
    </>
  );
}
