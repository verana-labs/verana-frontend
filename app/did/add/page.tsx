'use client'

import React, { useState } from 'react';
import { DidData, didSections } from '@/ui/dataview/datasections/did';
import { useActionDID } from '@/msg/actions_hooks/actionDID';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import TitleAndButton from '@/ui/common/title-and-button';
import { useRouter } from 'next/navigation';
import EditableDataView from '@/ui/common/data-edit';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

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
        title=  {`${resolveTranslatable({key: "did.add.title"}, translate)?? "Add DID to Directory"}  ${data.did}`}
        buttonLabel={resolveTranslatable({key: "button.did.back"}, translate)?? "Back to Directory"}
        to="/did"
        Icon={ChevronLeftIcon}
      />
      {/* Editable form */}
      <EditableDataView<DidData>
        sectionsI18n={didSections}
        id={undefined}
        messageType={'MsgAddDID'}     
        data={data}
        onSave={onSave}
        onCancel={() => router.push('/did')} />
    </>
  )
}
