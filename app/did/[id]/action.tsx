'use client';

import React, { useState } from 'react';
import EditableDataView from '@/ui/common/data-edit';
import { DidData, didSections } from '@/ui/dataview/datasections/did';
import { useActionDID } from '@/msg/actions_hooks/actionDID';
import { MsgTypeDID } from '@/msg/constants/notificationMsgForMsgType';

// Define DidActionPage props interface
interface DidActionProps {
  action: MsgTypeDID;  // Action type to perform
  onClose: () => void; // Collapse/hide action on cancel
  data: object;
  onRefresh?: () => void; // Refresh DID data
  onBack?: () => void; // Close modal
}

export default function DidActionPage({ action, onClose, data, onRefresh, onBack }: DidActionProps) {
  const didData = data as DidData;
  // Compose initial data
  const [dataDID, setData] = useState<DidData>({
    did: didData.did,
    years: 1
  });

  const actionDID = useActionDID(onClose, onRefresh, onBack);

  // Save handler: called when the form is submitted
  async function onSave(newData: DidData) {
    setData(newData);
    const didValue = didData.did;
    const numericYears = Number(newData.years ??  1);
    // Broadcast transaction with user input
    switch (action) {
      case 'MsgRenewDID':
        await actionDID({ msgType: 'MsgRenewDID', did: didValue, years: numericYears });
        break;
      case 'MsgTouchDID':
        await actionDID({ msgType: 'MsgTouchDID', did: didValue });
        break;
      case 'MsgRemoveDID':
        await actionDID({ msgType: 'MsgRemoveDID', did: didValue });
        break;
      default:
        break;
    }
  }

  return (
    <>
      {/* Editable form */}
      <EditableDataView<DidData>
        sectionsI18n={didSections}
        id={dataDID.did}
        messageType={action}     
        data={dataDID}
        onSave={onSave}
        onCancel={onClose}
        noForm={action!=='MsgRenewDID'} />
    </>
  );

}
