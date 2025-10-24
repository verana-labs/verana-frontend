'use client';

import React, { useState } from 'react';
import { TrData, trSections } from '@/ui/dataview/datasections/tr';
import EditableDataView from '@/ui/common/data-edit';
import TitleAndButton from '@/ui/common/title-and-button';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useVeranaChain } from '@/hooks/useVeranaChain';
import { useChain } from '@cosmos-kit/react';
import { useActionTR } from '@/msg/actions_hooks/actionTR';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

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
      {/* Page title and back button */}
      <TitleAndButton
        title=  {`${resolveTranslatable({key: "tr.add.title"}, translate)?? "New Trust Registry"}  ${data.did}`}
        buttonLabel={resolveTranslatable({key: "button.tr.back"}, translate)?? "Back to List"}
        to="/tr"
        Icon={ChevronLeftIcon}
      />
      {/* Editable form */}
      <EditableDataView<TrData>
        sectionsI18n={trSections}
        id={undefined}
        messageType={'MsgCreateTrustRegistry'}     
        data={data}
        onSave={onSave}
        onCancel={() => router.push('/tr')} />
    </>
  );
}
