'use client';

import React, { useState } from 'react';
import { TrData, trSections } from '@/ui/dataview/datasections/tr';
import EditableDataView from '@/ui/common/data-edit';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useActionTR } from '@/msg/actions_hooks/actionTR';

type AddTrPageProps = {
  onCancel: () => void;
  onRefresh: (id?: string, txHeight?: number) => void;
}

export default function AddTrPage({ onCancel, onRefresh }: AddTrPageProps) {
  // Load chain info
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  // Compose initial data; corporation defaults to the connected wallet for
  // self-execution (matches what action hooks will send).
  const [data, setData] = useState<TrData>({
    id: '',
    did: '',
    deposit: '',
    language: '',
    aka: '',
    corporation: address ?? '',
    docUrl: ''
  });

  const actionTR = useActionTR(onCancel, onRefresh);

  // Save handler: called when the form is submitted
  async function onSave(newData: TrData) {
      setData(newData);
      // Broadcast MsgCreateTrustRegistry transaction with user input
      await actionTR({
        msgType: 'MsgCreateTrustRegistry',
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
