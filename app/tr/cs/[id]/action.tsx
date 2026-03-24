'use client';

import EditableDataView from '@/ui/common/data-edit';
import { MessageType } from '@/msg/constants/types';
import { MsgTypeCS } from '@/msg/constants/notificationMsgForMsgType';
import { CsData, csSections } from '@/ui/dataview/datasections/cs';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

// Define CsActionPage props interface
interface CsActionProps {
  action: MsgTypeCS;  // Action type to perform
  data: object;
  onClose: () => void; // Collapse/hide action on cancel
  onRefresh?: (id?: string, txHeight?: number) => void; // Refresh data
  setModalHidden?: () => void; // Hidden/Visible modal
}

export default function CsActionPage({ action, onClose, data, onRefresh, setModalHidden }: CsActionProps) {
  const csData = data as CsData;
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
      case 'MsgUpdateCredentialSchema':
        return false;
      case 'MsgArchiveCredentialSchema':
      case 'MsgUnarchiveCredentialSchema':
      default:
        return true;
    }
  }
  
  return (
    <>
      {/* Editable form */}
      <EditableDataView<CsData>
        sectionsI18n={csSections}
        id={csData.id as string}
        messageType={action as MessageType}     
        data={csData}
        onSave={onSave}
        onSimulate={onSimulate}
        onCancel={onClose}
        noForm={isNoForm()} 
        withinView={action==='MsgUpdateCredentialSchema'}
        setModalHidden={setModalHidden}
      />
    </>
  );

}
