'use client';

import EditableDataView from '@/ui/common/data-edit';
import { useActionPerm } from '@/msg/actions_hooks/actionPerm';
import { Permission, PermissionData, getActionPermSections } from '@/ui/dataview/datasections/perm';
import { MsgTypePERM } from '@/msg/constants/notificationMsgForMsgType';
import { MessageType } from '@/msg/constants/types';
import { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino';
import { useNotification } from '@/providers/notification-provider';
import { resolveTranslatable } from '@/ui/dataview/types';
import { translate } from '@/i18n/dataview';

// Define PermActionPage props interface
interface PermActionProps {
  action: MsgTypePERM;  // Action type to perform
  data: object;
  onClose: () => void; // Collapse/hide action on cancel
  onRefresh?: (id?: string, txHeight?: number) => void; // Refresh Permission data
  setModalHidden?: () => void; // Hidden/Visible modal
}

export default function PermActionPage({ action, data, onClose, onRefresh, setModalHidden }: PermActionProps) {
  const permData = data as Permission;
  const actionPerm = useActionPerm(onClose, onRefresh);
  const { notify } = useNotification();

  // Save handler: called when the form is submitted
  async function onSave(formData: object) {
    const newData = formData as PermissionData;
    // Broadcast transaction with user input
    switch (action) {
      case 'MsgRenewPermissionVP':
      case 'MsgCancelPermissionVPLastRequest':
      case 'MsgRevokePermission':
        await actionPerm({
          msgType: action,
          id: permData.id
        });
        break;

      case 'MsgRepayPermissionSlashedTrustDeposit': {
        const outstanding =
          Number(permData.slashed_deposit ?? 0) - Number(permData.repaid_deposit ?? 0);
        if (!Number.isFinite(outstanding) || outstanding <= 0) {
          await notify(
            resolveTranslatable({ key: 'error.msg.perm.repay.no.outstanding' }, translate) ??
              'Nothing to repay: no outstanding slashed deposit on this permission.',
            'error',
          );
          onClose();
          return;
        }
        await actionPerm({
          msgType: 'MsgRepayPermissionSlashedTrustDeposit',
          id: permData.id,
          amount: outstanding,
        });
        break;
      }

      case 'MsgSetPermissionVPToValidated':
        await actionPerm({
          msgType: 'MsgSetPermissionVPToValidated',
          id: permData.id,
          effectiveUntil: newData.effectiveUntil,
          validationFees: newData.validationFees?? 0,
          issuanceFees: newData.issuanceFees?? 0,
          verificationFees: newData.verificationFees?? 0,
          vpSummaryDigest: newData.vpSummaryDigestSri?? ''
        });
        break;

      case 'MsgAdjustPermission':
        await actionPerm({
          msgType: 'MsgAdjustPermission',
          id: permData.id,
          effectiveUntil: newData.effectiveUntil,
        });
        break;

      case 'MsgSlashPermissionTrustDeposit': {
        const reason = (newData as { reason?: string }).reason?.trim() ?? '';
        if (!reason) {
          // Keep the modal open so the user can add a reason and retry,
          // instead of forcing them to re-open the action.
          await notify(
            resolveTranslatable({ key: 'error.msg.perm.slash.reason.required' }, translate) ??
              'A reason is required to slash a permission. Slash UI is not yet wired up for spec v4.',
            'error',
          );
          return;
        }
        await actionPerm({
          msgType: 'MsgSlashPermissionTrustDeposit',
          id: permData.id,
          amount: newData.amount ?? 0,
          reason,
        });
        break;
      }

      case 'MsgCreateRootPermission':
        await actionPerm({
          msgType: 'MsgCreateRootPermission',
          schemaId: permData.schema_id,
          did: newData.did as string,
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
          type: permData.type,
          validatorPermId: permData.validator_perm_id ?? 0,
          did: newData.did as string,
        });
        break;

      case 'MsgSelfCreatePermission':
        await actionPerm({
          msgType: 'MsgSelfCreatePermission',
          validatorPermId: permData.validator_perm_id ?? 0,
          type: permData.type,
          did: newData.did as string,
          effectiveFrom: newData.effectiveFrom,
          effectiveUntil: newData.effectiveUntil,
          validationFees: newData.validationFees?? 0,
          verificationFees: newData.verificationFees?? 0,
        });
        break;

      default:
        break;
    }
  }

  // Generic simulate handler:
  async function onSimulate(_data: object): Promise<SimulateResult | void> {
    switch (action) {
      case 'MsgRenewPermissionVP':
      case 'MsgCancelPermissionVPLastRequest':
      case 'MsgRevokePermission':
        const res =  await actionPerm({ msgType: action, id: permData.id}, true);
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
      case 'MsgAdjustPermission':
      case 'MsgSlashPermissionTrustDeposit':
      case 'MsgCreateRootPermission':
      case 'MsgStartPermissionVP':
      case 'MsgSelfCreatePermission':
        return false;
      default:
        return true;
    }
  }

  const sectionPermission = getActionPermSections(action, ["VERIFIER", "HOLDER"].includes(permData.type));

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
        transactionCost={permData.transaction_cost}
      />
    </>
  );

}
