'use client';

import React, { useState, useId, ReactNode } from 'react';
import { Section, TypeToken } from '@/ui/dataview/types';
import { DataType, getMsgTypeFor } from '@/msg/constants/msgTypeForDataType';
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import EditableDataView from './data-edit';
import DataView from './data-view-columns';
import { MsgTypeCS, MsgTypeDID, MsgTypePERM, MsgTypeTD, MsgTypeTR } from '@/msg/constants/notificationMsgForMsgType';
import GfdPage from '@/tr/[id]/gfd';
import DidActionPage from '@/did/[id]/action';
import TdActionPage from '@/account/action';
import GetVNATokens from './get-vna';
import PermActionPage from '@/participants/[id]/action';
import IconLabelButton from './icon-label-button';
import clsx from 'clsx';
import { ModalAction } from './modal-action';
import CsActionPage from '@/tr/cs/[id]/action';
import TrActionPage from '@/tr/[id]/action';

// Wrapper for DataView that lets you pass the generic parameter explicitly
export default function DataViewTyped<I extends object>(props: {
  objectData: TypeToken<I>;
  sections: Section<I> | ReadonlyArray<Section<I>>;
  data: I;
  id?: string;
  edit?: boolean;
  getTitle?: (item: I) => React.ReactNode;
  onActiveActionId?:  () => void;
  onRefresh?:  () => void;
}) {
  
  const { objectData, sections, data, id, edit, getTitle, onRefresh } = props;
  const normalized = Array.isArray(sections) ? sections : [sections];
  const title = getTitle?.(data);
  // Local expand/collapse state per instance (default: collapsed)
  const [expanded, setExpanded] = useState(() => {
    const idUpdated = sessionStorage.getItem('id_updated');
    if (id && idUpdated === id ){
      // Remove id_updated from session
      if (idUpdated) sessionStorage.removeItem('id_updated');
      return true;
    }
    return false;
  });

  // Build a stable content id for aria-controls
  const reactId = useId();
  const contentId = id ? `${id}-dv-content` : `dv-content-${reactId}`;
  const [editing, setEditing] = useState(id? false: true);
  const msgType = getMsgTypeFor(objectData.typeName as DataType, id? "update" : "create");
  const { submitTx } = useSubmitTxMsgTypeFromObject( id ? () => setEditing(false) : () => setExpanded(false), () => onRefresh );

  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data);
  }

  return (
    <div>
      {title ? ( // Title rendered as a link-like button that toggles the content
      <button
        onClick={() => setExpanded((v) => !v)}
        className="btn-link mb-2 gap-2"
      >
        <span >{title}</span>
        {expanded ? (
          <FontAwesomeIcon icon={faChevronUp}/>
        ) : (
          <FontAwesomeIcon icon={faChevronDown}/>
        )}
      </button>
      ) : null}

      {/* Only render DataView when expanded; if you prefer to keep it mounted, wrap in a div and use hidden={!expanded} */}
      {expanded && (
      <div id={contentId}>
      {editing ? (
        <EditableDataView<I>
          sectionsI18n={normalized}
          data={data}
          messageType={msgType}
          id={id? id : undefined}
          onSave={ onSave }
          onCancel={id? () => setEditing(false) : () => setExpanded(false)}  />
      ) : (
        <DataView<I>
          sectionsI18n={normalized}
          data={data}
          id={id}
          // onEdit={ () => setEditing(true)}
          onEdit={ edit? () => setEditing(true) : undefined }
        />
      )}

      </div>
      )}
    </div>
  );
}

// Helper that binds the generic type I from the token
export function renderObjectList<I extends object>(args: {
  objectData: TypeToken<I>;
  sections: Section<I> | ReadonlyArray<Section<I>>;
  items: readonly I[];
  columnsCount?: number;
  edit?: boolean;
  getId?: (item: I, idx: number) => string | number | undefined;
  onRefresh?:  () => void;
}) {
  const { objectData, sections, items, edit, getId, onRefresh } = args;
  return items.map((item, idx) => (
    <DataViewTyped<I>
      key={(getId?.(item, idx) || idx) as React.Key}
      objectData={objectData}
      sections={sections}
      data={item}
      id={String(getId?.(item, idx) ?? idx)}
      edit={edit}
      getTitle={(d) => (d as any).title ?? ""}  // eslint-disable-line @typescript-eslint/no-explicit-any
      onRefresh={onRefresh}
    />
  ));
}

// Define the valid actions for DID
const validDIDAction = (action: string): action is MsgTypeDID => 
  ['MsgAddDID','MsgRenewDID','MsgTouchDID','MsgRemoveDID'].includes(action);

// Define the valid actions for TD
const validTDAction = (action: string): action is MsgTypeTD => 
  ['MsgReclaimTrustDeposit','MsgReclaimTrustDepositYield'].includes(action);

// Define the valid actions for TR-GFD
export const validGFDAction = (action: string): action is MsgTypeTR => 
  ['MsgAddGovernanceFrameworkDocument','MsgIncreaseActiveGovernanceFrameworkVersion'].includes(action);

// Define the valid actions for TR
export const validTRAction = (action: string): action is MsgTypeTR => 
  ['MsgUpdateTrustRegistry','MsgArchiveTrustRegistry','MsgUnarchiveTrustRegistry'].includes(action);

// Define the valid actions for PERM
export const validPermAction = (action: string): action is MsgTypePERM => 
  ['MsgCancelPermissionVPLastRequest','MsgRenewPermissionVP','MsgSetPermissionVPToValidated', 
  'MsgExtendPermission','MsgRevokePermission','MsgSlashPermissionTrustDeposit','MsgRepayPermissionSlashedTrustDeposit',
  'MsgCreateRootPermission'].includes(action);

// Define the valid actions for CS
const validCSAction = (action: string): action is MsgTypeCS => 
  ['MsgUnarchiveCredentialSchema','MsgArchiveCredentialSchema','MsgUpdateCredentialSchema'].includes(action);

// Helper to render the correct action component
export function renderActionComponent(
  action: string,
  onClose: () => void,
  data: object,
  onRefresh?: () => void,
  onBack?: () => void
): ReactNode {
  if (validDIDAction(action)) {
    return <DidActionPage action={action} data={data} onClose={onClose} onRefresh={onRefresh} onBack={onBack}/>;
  }
  if (action === 'GetVNATrustDeposit') {
    return <GetVNATokens/>;
  }
  if (validTDAction(action)) {
    return <TdActionPage action={action} data={data} onClose={onClose} onRefresh={onRefresh}/>;
  }
  if (validGFDAction(action)) {
    return <GfdPage action={action} data={data} onClose={onClose} onRefresh={onRefresh}/>;
  }
  if (validPermAction(action)) {
    return <PermActionPage action={action} data={data} onClose={onClose} onRefresh={onRefresh}/>;
  }
  if (validCSAction(action)) {
    return <CsActionPage action={action} data={data} onClose={onClose} onRefresh={onRefresh}/>;
  }
  if (validTRAction(action)) {
    return <TrActionPage action={action} data={data} onClose={onClose} onRefresh={onRefresh}/>;
  }
  return null;
}

export interface ActionFieldProps {
  name: string;
  label: string;
  value: string;
  description?: string; 
  icon?: IconDefinition;
  iconColorClass?: string;
  iconClass?: string;
  isWarning?: boolean;
}

// Helper to render the correct action field: Button & Modal
export function renderActionFieldModalAndButton(
  data: object,
  action: ActionFieldProps,
  idx: number,
  isActive: boolean,
  onClickButton: () => void,
  onClose: () => void,
  onRefresh?: () => void
  ) {
    return (
      <section key={`action-${String(action.name)}-${idx}`}>
        <IconLabelButton
          label={action.label}
          icon={action.icon}
          className={clsx(
            "btn-action-confirm text-sm", // base
            action.iconColorClass // specific
          )}
          onClick={onClickButton}
        />

        {action.value ? (
          <ModalAction
            onClose={onClose}
            titleKey={action.label}
            isActive={isActive}
          >
            {renderActionComponent(
              action.value,
              onClose,
              data,
              onRefresh,
              undefined
            )}
          </ModalAction>
        ) : null}
      </section>
    );
  }
