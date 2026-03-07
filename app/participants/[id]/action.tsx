'use client';

import EditableDataView from '@/ui/common/data-edit';
import { useActionPerm } from '@/msg/actions_hooks/actionPerm';
import { Permission, PermissionData, getActionPermSections } from '@/ui/dataview/datasections/perm';
import { MsgTypePERM } from '@/msg/constants/notificationMsgForMsgType';
import { MessageType } from '@/msg/constants/types';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';

// Define PermActionPage props interface
interface PermActionProps {
  action: MsgTypePERM;  // Action type to perform
  data: object;
  onClose: () => void; // Collapse/hide action on cancel
  onRefresh?: (id?: string) => void; // Refresh Permission data
  setModalHidden?: () => void; // Hidden/Visible modal
}

export default function PermActionPage({ action, data, onClose, onRefresh, setModalHidden }: PermActionProps) {
  const permData = data as Permission;
  const actionPerm = useActionPerm(onClose, onRefresh);

  // Save handler: called when the form is submitted
  async function onSave(formData: object) {
    const newData = formData as PermissionData;
    // Broadcast transaction with user input
    switch (action) {
      case 'MsgRenewPermissionVP':
      case 'MsgCancelPermissionVPLastRequest':
      case 'MsgRevokePermission':
      case 'MsgRepayPermissionSlashedTrustDeposit':
        await actionPerm({
          msgType: action,
          creator: '',
          id: permData.id
        });
        break;
      case 'MsgSetPermissionVPToValidated':
        await actionPerm({
          msgType: 'MsgSetPermissionVPToValidated',
          creator: "",
          id: permData.id,
          effectiveUntil: newData.effectiveUntil,
          validationFees: newData.validationFees?? 0,
          issuanceFees: newData.issuanceFees?? 0,
          verificationFees: newData.verificationFees?? 0,
          country: permData.country,
          vpSummaryDigestSri: newData.vpSummaryDigestSri?? ''
        });
        break;
      case 'MsgExtendPermission':
        await actionPerm({
          msgType: 'MsgExtendPermission',
          creator: "",
          id: permData.id,
          effectiveUntil: newData.effectiveUntil,
        });
        break;
      case 'MsgSlashPermissionTrustDeposit':
        await actionPerm({
          msgType: 'MsgSlashPermissionTrustDeposit',
          creator: "",
          id: permData.id,
          amount: newData.amount??0
        });
        break;
      case 'MsgCreateRootPermission':
        await actionPerm({
          msgType: 'MsgCreateRootPermission',
          creator: "",
          schemaId: permData.schema_id,
          did: newData.did as string,
          country: newData.country as string,
          effectiveFrom: newData.effectiveFrom,
          effectiveUntil: newData.effectiveUntil,
          validationFees: newData.validationFees?? 0,
          issuanceFees: newData.issuanceFees?? 0,
          verificationFees: newData.verificationFees?? 0,
        });
        break;
      case 'MsgStartPermissionVP':
        await actionPerm({
          msgType: 'MsgStartPermissionVP',
          creator: "",
          type: Number(permData.type),
          validatorPermId: permData.validator_perm_id,
          did: newData.did as string,
          country: newData.country as string,
        });
        break;
      default:
        break;
    }
  }

  // Generic simulate handler:
  async function onSimulate(data: object): Promise<SimulateResult | void> {
    switch (action) {
      case 'MsgRenewPermissionVP':
      case 'MsgCancelPermissionVPLastRequest':
      case 'MsgRevokePermission':
      case 'MsgRepayPermissionSlashedTrustDeposit': 
        const res =  await actionPerm({ msgType: action, creator: '', id: permData.id}, true);
        if (res && typeof res === "object" && !("transactionHash" in res)) {
          return res as SimulateResult;
        }
      default :
        return;
    }
  }
  

  function isNoForm() {
    switch (action) {
      case 'MsgRenewPermissionVP':
      case 'MsgCancelPermissionVPLastRequest':
      case 'MsgRevokePermission':
      case 'MsgRepayPermissionSlashedTrustDeposit':
        return true;
      case 'MsgSetPermissionVPToValidated':
      case 'MsgExtendPermission':
      case 'MsgSlashPermissionTrustDeposit':
      case 'MsgCreateRootPermission':
      case 'MsgStartPermissionVP':
        return false;
      default:
        return true;
    }
  }
  
  const sectionPermission = getActionPermSections(action);
  return (
    <>
      {/* Editable form */}
      <EditableDataView<PermissionData>
        sectionsI18n={sectionPermission}
        id={permData.id}
        messageType={action as MessageType}     
        data={{}}
        onSave={onSave}
        onSimulate={onSimulate}
        isModal={true}
        onCancel={onClose}
        noForm={isNoForm()} 
        setModalHidden={setModalHidden}
      />
    </>
  );

}
