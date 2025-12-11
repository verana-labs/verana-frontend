'use client';

import React, { useState } from 'react';
import { TrData, trSections } from '@/ui/dataview/datasections/tr';
import EditableDataView from '@/ui/common/data-edit';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useActionTR } from '@/msg/actions_hooks/actionTR';

type AddTrPageProps = {
  onCancel: () => void;
  onRefresh: () => void;
}

export default function AddTrPage({ onCancel }: AddTrPageProps) {
  // Load chain info
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  // Compose initial data, including controller and docUrl if needed
  const [data, setData] = useState<TrData>({
    id: '',
    did: '',
    deposit: '',
    language: '',
    aka: '',
    controller: address ?? '',
    docUrl: ''
  });

  const actionTR = useActionTR();

  // Save handler: called when the form is submitted
  async function onSave(newData: TrData) {
      setData(newData);
      // Broadcast MsgCreateTrustRegistry transaction with user input
      await actionTR({
        msgType: 'MsgCreateTrustRegistry',
        creator: address ?? '',
        did: newData.did || '',
        aka: newData.aka || '',
        language: newData.language || '',
        docUrl: newData.docUrl || '',
      });
  }

  return (
    <>
      {/* Editable form */}
      <EditableDataView<TrData>
        sectionsI18n={trSections}
        id={undefined}
        messageType={'MsgCreateTrustRegistry'}     
        data={data}
        onSave={onSave}
        onCancel={onCancel}
        isModal={true}
      />
    </>
  );
}
