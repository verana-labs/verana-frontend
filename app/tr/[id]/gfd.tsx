'use client';

import React, { useState } from 'react';
import { GfdData, gfdSections, TrData } from '@/app/types/dataViewTypes';
import EditableDataView from '@/app/ui/common/data-edit';
import { useActionTR } from '@/app/msg/trust-registry/actionTR';
import { MsgTypeTR } from '@/app/constants/notificationMsgForMsgType';

// Define GfdPage props interface
interface GfdPageProps {
  action: MsgTypeTR;  // Action type to perform
  setActiveActionId: React.Dispatch<React.SetStateAction<string | null>>; // Collapse/hide action on cancel
  data: object
}

export default function GfdPage({ action, setActiveActionId, data }: GfdPageProps) {
    
  const trData: TrData = data as TrData;
  // Compose initial data, including controller and docUrl if needed
  const [dataGFD, setData] = useState<GfdData>({
    creator: trData.controller?? '',
    id: trData.id,
    version: trData.last_version,
    docLanguage: '',
    docUrl: '',
  });

  const actionTR = useActionTR();

  // Save handler: called when the form is submitted
  async function onSave(newData: GfdData) {
      setData(newData);
      // Broadcast AddGovernanceFrameworkDocument transaction with user input
      await actionTR({
        msgType: "MsgAddGovernanceFrameworkDocument",
        creator: trData.controller,
        id: trData.id,
        version: trData.last_version?? 0,
        docLanguage: newData.docLanguage?? '',
        docUrl: newData.docUrl?? ''
      });
  }

  // Save handler: called when the form is submitted
  async function onIncrement() {
    await actionTR({
      msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion',
      id: trData.id,
      creator: trData.controller
    });
  }
  

  return (
    <>
      {/* Editable form */}
      <EditableDataView<GfdData>
        sections={gfdSections}
        id={(action === 'MsgAddGovernanceFrameworkDocument')? undefined : dataGFD.id}
        messageType={action}     
        data={dataGFD}
        onSave={(action === 'MsgAddGovernanceFrameworkDocument')? onSave : onIncrement }
        onCancel={() => setActiveActionId(null)} />
    </>
  );
}
