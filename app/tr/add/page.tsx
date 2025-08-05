'use client';

import React, { useState } from 'react';
import { TrData, trSections } from '@/app/types/dataViewTypes';
import EditableDataView from '@/app/ui/common/data-edit';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useVeranaChain } from '@/app/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useActionTR } from '@/app/msg/trust-registry/actionTR';

export default function TrNewPage() {
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

  const router = useRouter();
  const actionTR = useActionTR();

  // Save handler: called when the form is submitted
  async function onSave(newData: TrData) {
      setData(newData);
      // Broadcast CreateTrustRegistry transaction with user input
      await actionTR({
        msgType: 'CreateTrustRegistry',
        creator: address ?? '',
        did: newData.did || '',
        aka: newData.aka || '',
        language: newData.language || '',
        docUrl: newData.docUrl || '',
      });
  }

  return (
    <>
      {/* Page title and back button */}
      <TitleAndButton
        title="New Trust Registry"
        buttonLabel="Back to List"
        to="/tr"
        Icon={ChevronLeftIcon}
      />
      {/* Editable form */}
      <EditableDataView<TrData>
        sections={trSections}
        id={undefined}
        messageType={'MsgCreateTrustRegistry'}     
        data={data}
        onSave={onSave}
        onCancel={() => router.push('/tr')} />
    </>
  );
}
