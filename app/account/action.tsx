'use client';

import React, { useState } from 'react';
import EditableDataView from '@/app/ui/common/data-edit';
import { TdData, tdSections } from '@/app/types/dataViewTypes';
import { useActionTD } from '@/app/msg/actions_hooks/actionTD';
import { MsgTypeTD } from '@/app/constants/notificationMsgForMsgType';

// Define TdActionPage props interface
interface TdActionProps {
  action: MsgTypeTD;  // Action type to perform
  setActiveActionId: React.Dispatch<React.SetStateAction<string | null>>; // Collapse/hide action on cancel
  data: object;
  setRefresh?: React.Dispatch<React.SetStateAction<string | null>>; // Refresh TD data
}

export default function TdActionPage({ action, setActiveActionId, setRefresh }: TdActionProps) {
  // Compose initial data
  const [dataTD, setData] = useState<TdData>({
    claimedVNA: 0
  });

  const actionTD = useActionTD(setActiveActionId, setRefresh);

  // Save handler: called when the form is submitted
  async function onSave(newData: TdData) {
    setData(newData);
    const claimedVNA = Number(newData.claimedVNA ??  0);
    // Broadcast transaction with user input
    switch (action) {
      case 'MsgReclaimTrustDeposit':
        await actionTD({ msgType: 'MsgReclaimTrustDeposit', claimedVNA });
        break;
      case 'MsgReclaimTrustDepositYield':
        await actionTD({ msgType: 'MsgReclaimTrustDepositYield'});
        break;
      default:
        break;
    }
  }

  return (
    <>
      {/* Editable form */}
      <EditableDataView<TdData>
        sections={tdSections}
        id={"id"}
        messageType={action}     
        data={dataTD}
        onSave={onSave}
        onCancel={() => setActiveActionId(null)}
        noForm={action!=='MsgReclaimTrustDeposit'} />
    </>
  );

}
