'use client'

import React, { useState } from 'react';
import { DidData, didSections } from '@/app/types/dataViewTypes';
import { useActionDID } from '@/app/msg/actions_hooks/actionDID';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/app/ui/common/title-and-button';
import { useRouter } from 'next/navigation';
import EditableDataView from '@/app/ui/common/data-edit';

export default function AddDidPage() {

  // Compose initial data
  const [data, setData] = useState<DidData>({
    did: '',
    years: 1
  });

  const router = useRouter();
  const actionDID = useActionDID();

  // Save handler: called when the form is submitted
  async function onSave(newData: DidData) {
      setData(newData);
      // Broadcast MsgCreateTrustRegistry transaction with user input
      await actionDID({
        msgType: 'MsgAddDID',
        did: newData.did?? '',
        years: newData.years?? 1
      });
  }

  return (
    <>
      {/* Page title and back button */}
      <TitleAndButton
        title="Add DID to Directory"
        buttonLabel="Back to Directory"
        to="/did"
        Icon={ChevronLeftIcon}
      />
      {/* Editable form */}
      <EditableDataView<DidData>
        sections={didSections}
        id={undefined}
        messageType={'MsgAddDID'}     
        data={data}
        onSave={onSave}
        onCancel={() => router.push('/did')} />
    </>
  )
}
