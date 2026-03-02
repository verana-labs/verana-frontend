'use client';

import React, { useState } from 'react';
import { GfdData, gfdSections } from '@/ui/dataview/datasections/gfd';
import { TrData } from '@/ui/dataview/datasections/tr';
import EditableDataView from '@/ui/common/data-edit';
import { useActionTR } from '@/msg/actions_hooks/actionTR';
import { MsgTypeTR } from '@/msg/constants/notificationMsgForMsgType';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

// Define GfdPage props interface
interface GfdPageProps {
  action: MsgTypeTR;  // Action type to perform
  data: object;
  onClose: () => void; // Collapse/hide action on cancel
  onRefresh?: () => void; // Refresh TR data
}

export default function GfdPage({ action, data, onClose, onRefresh }: GfdPageProps) {
    
  const trData: TrData = data as TrData;
  // Compose initial data, including controller and docUrl if needed
  const [dataGFD, setData] = useState<GfdData>({
    creator: trData.controller?? '',
    id: trData.id,
    version: trData.last_version,
    docLanguage: '',
    docUrl: '',
  });

  const actionTR = useActionTR(onClose, onRefresh);

  // Save handler: called when the form is submitted
  async function onSave(newData: GfdData) {
    setData(newData);
    // Broadcast AddGovernanceFrameworkDocument transaction with user input
    switch (action){
      case "MsgAddGovernanceFrameworkDocument":
        await actionTR({
          msgType: "MsgAddGovernanceFrameworkDocument",
          creator: trData.controller,
          id: trData.id,
          version: trData.last_version?? 0,
          docLanguage: newData.docLanguage?? '',
          docUrl: newData.docUrl?? ''
        });
        break;
      case "MsgIncreaseActiveGovernanceFrameworkVersion":
        await actionTR({
          msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion',
          id: trData.id,
          creator: trData.controller
        });
        break;
      default:
        break;
    }
  }

  // Simulate handler: called when the form is simulated
  async function onSimulate(newData: GfdData) {
    switch (action){
      case "MsgIncreaseActiveGovernanceFrameworkVersion":
        const res =  await actionTR({ msgType: 'MsgIncreaseActiveGovernanceFrameworkVersion', id: trData.id, creator: trData.controller }, true);
        if (res && typeof res === "object" && !("transactionHash" in res)) {
          return res as SimulateResult;
        }
      default:
        return;
    }
  }
  

  return (
    <>
      {/* Editable form */}
      <EditableDataView<GfdData>
        sectionsI18n={gfdSections}
        id={(action === 'MsgAddGovernanceFrameworkDocument')? undefined : dataGFD.id}
        messageType={action}     
        data={dataGFD}
        onSave={onSave}
        onSimulate={onSimulate}
        onCancel={onClose}
        noForm={action === "MsgIncreaseActiveGovernanceFrameworkVersion"} />
    </>
  );
}
