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
};

export default function AddTrPage({ onCancel, onRefresh }: AddTrPageProps) {
  const veranaChain = useVeranaChain();
  const { address } = useChain(veranaChain.chain_name);

  const [data, setData] = useState<TrData>({
    id: '',
    did: '',
    deposit: '',
    language: '',
    aka: '',
    controller: address ?? '',
    docUrl: '',
    orgName: '',
    trServiceName: '',
  });

  const actionTR = useActionTR(onCancel, onRefresh);

  // `orgName` / `trServiceName` are spec-only fields today: they live in form
  // state for v4 layout parity but are not part of MsgCreateTrustRegistry. They
  // will be persisted via ECS-ORG / ECS-SERVICE credentials once #368 lands.
  async function onSave(newData: TrData) {
    setData(newData);
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
    <EditableDataView<TrData>
      sectionsI18n={trSections}
      id={undefined}
      messageType={'MsgCreateTrustRegistry'}
      data={data}
      onSave={onSave}
      onCancel={onCancel}
      isModal={true}
    />
  );
}
