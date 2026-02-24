'use client';

import EditableDataView from '@/ui/common/data-edit';
import { MessageType } from '@/msg/constants/types';
import { MsgTypeTR } from '@/msg/constants/notificationMsgForMsgType';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { TrData, trSections } from '@/ui/dataview/datasections/tr';

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
        onCancel={onClose}
        noForm={isNoForm()} 
        withinView={action==='MsgUpdateTrustRegistry'}/>
    </>
  );

}
