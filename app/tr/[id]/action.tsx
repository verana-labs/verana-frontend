'use client';

import EditableDataView from '@/ui/common/data-edit';
import { MessageType } from '@/msg/constants/types';
import { MsgTypeTR } from '@/msg/constants/notificationMsgForMsgType';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { TrData, trSections } from '@/ui/dataview/datasections/tr';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

// Define TrActionPage props interface
interface TrActionProps {
  action: MsgTypeTR;  // Action type to perform
  data: object;
  onClose: () => void; // Collapse/hide action on cancel
  onRefresh?: () => void; // Refresh data
}

export default function TrActionPage({ action, onClose, data, onRefresh }: TrActionProps) {
  const trData = data as TrData;
  const msgType = action as MessageType;
  const { submitTx } = useSubmitTxMsgTypeFromObject( onClose, onRefresh );

  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data);
  }

  // Generic simulate handler:
  async function onSimulate(data: object): Promise<SimulateResult | void> {
    if (!isNoForm()) return;
    const res = await submitTx(msgType, data, true);
    if (res && typeof res === "object" && !("transactionHash" in res)) {
      return res as SimulateResult;
    }
    return;
  }

  function isNoForm() {
    switch (action) {
      case 'MsgUpdateTrustRegistry':
        return false;
      case 'MsgArchiveTrustRegistry':
      case 'MsgUnarchiveTrustRegistry':
      default:
        return true;
    }
  }
  
  return (
    <>
      {/* Editable form */}
      <EditableDataView<TrData>
        sectionsI18n={trSections}
        id={trData.id as string}
        messageType={action as MessageType}     
        data={trData}
        onSave={onSave}
        onSimulate={onSimulate}
        onCancel={onClose}
        noForm={isNoForm()} 
        withinView={action==='MsgUpdateTrustRegistry'}/>
    </>
  );

}
