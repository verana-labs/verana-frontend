'use client'

import React, { useState } from 'react';
import { DidData, didSections } from '@/ui/dataview/datasections/did';
import { useActionDID } from '@/msg/actions_hooks/actionDID';
import EditableDataView from '@/ui/common/data-edit';

type AddDidPageProps = {
  onCancel: () => void;
  onRefresh: () => void;
}

export default function AddDidPage({ onCancel, onRefresh }: AddDidPageProps) {

  // Compose initial data
  const [data, setData] = useState<DidData>({
    did: '',
    years: 1
  });

  const actionDID = useActionDID(onCancel, onRefresh);

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
      {/* Editable form */}
      <EditableDataView<DidData>
        sectionsI18n={didSections}
        id={undefined}
        messageType={'MsgAddDID'}     
        data={data}
        onSave={onSave}
        onCancel={onCancel}
        isModal={true}
      />
    </>
  )
}
