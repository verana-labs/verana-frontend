'use client'

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { ReactNode, useId, useState } from 'react'
import TdActionPage from '@/account/action'
import CredentialSchemaActionPage from '@/credential-schemas/[id]/action'
import EcosystemActionPage from '@/ecosystems/[id]/action'
import GovernanceFrameworkActionPage from '@/ecosystems/[id]/governance-framework-action'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { DataType, getMsgTypeFor } from '@/msg/constants/msgTypeForDataType'
import { MsgTypeCS, MsgTypeEcosystem, MsgTypeParticipant, MsgTypeTD } from '@/msg/constants/notificationMsgForMsgType'
import ParticipantActionPage from '@/participants/[id]/action'
import EditableDataView from '@/ui/common/data-edit'
import ColumnsDataView from '@/ui/common/data-view-columns'
import GetVNATokens from '@/ui/common/get-vna'
import { Section, TypeToken } from '@/ui/dataview/types'

// Wrapper for DataView that lets you pass the generic parameter explicitly
export default function DataViewTyped<I extends object>(props: {
  objectData: TypeToken<I>
  sections: Section<I> | ReadonlyArray<Section<I>>
  data: I
  id?: string
  edit?: boolean
  getTitle?: (item: I) => React.ReactNode
  onActiveActionId?: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
}) {
  const { objectData, sections, data, id, edit, getTitle, onRefresh } = props
  const normalized = Array.isArray(sections) ? sections : [sections]
  const title = getTitle?.(data)
  // Local expand/collapse state per instance (default: collapsed)
  const [expanded, setExpanded] = useState(() => {
    const idUpdated = sessionStorage.getItem('id_updated')
    if (id && idUpdated === id) {
      // Remove id_updated from session
      if (idUpdated) sessionStorage.removeItem('id_updated')
      return true
    }
    return false
  })

  // Build a stable content id for aria-controls
  const reactId = useId()
  const contentId = id ? `${id}-dv-content` : `dv-content-${reactId}`
  const [editing, setEditing] = useState(!id)
  const msgType = getMsgTypeFor(objectData.typeName as DataType, id ? 'update' : 'create')
  const { submitTx } = useSubmitTxMsgTypeFromObject(id ? () => setEditing(false) : () => setExpanded(false), onRefresh)

  /**
   * Generic save handler:
   * - Receives msgType and a generic data object
   * - Directly forwards both to submitTx
   */
  async function onSave(data: object) {
    await submitTx(msgType, data)
  }

  return (
    <div>
      {title ? ( // Title rendered as a link-like button that toggles the content
        <button onClick={() => setExpanded((v) => !v)} className="btn-link mb-2 gap-2">
          <span>{title}</span>
          {expanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
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
              id={id ? id : undefined}
              onSave={onSave}
              onCancel={id ? () => setEditing(false) : () => setExpanded(false)}
            />
          ) : (
            <ColumnsDataView<I>
              sectionsI18n={normalized}
              data={data}
              id={id}
              // onEdit={ () => setEditing(true)}
              onEdit={edit ? () => setEditing(true) : undefined}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Helper that binds the generic type I from the token
export function renderObjectList<I extends object>(args: {
  objectData: TypeToken<I>
  sections: Section<I> | ReadonlyArray<Section<I>>
  items: readonly I[]
  columnsCount?: number
  edit?: boolean
  getId?: (item: I, idx: number) => string | number | undefined
  onRefresh?: (id?: string, txHeight?: number) => void
}) {
  const { objectData, sections, items, edit, getId, onRefresh } = args
  return items.map((item, idx) => (
    <DataViewTyped<I>
      key={(getId?.(item, idx) || idx) as React.Key}
      objectData={objectData}
      sections={sections}
      data={item}
      id={String(getId?.(item, idx) ?? idx)}
      edit={edit}
      getTitle={(data) => {
        const title = (data as Record<string, unknown>).title
        return typeof title === 'string' ? title : ''
      }}
      onRefresh={onRefresh}
    />
  ))
}

// Define the valid actions for TD
const validTDAction = (action: string): action is MsgTypeTD =>
  ['MsgReclaimTrustDepositYield', 'MsgRepaySlashedTrustDeposit'].includes(action)

export const validGovernanceFrameworkAction = (action: string): action is MsgTypeEcosystem =>
  ['MsgAddGovernanceFrameworkDocument', 'MsgIncreaseActiveGovernanceFrameworkVersion'].includes(action)

export const validEcosystemAction = (action: string): action is MsgTypeEcosystem =>
  ['MsgUpdateEcosystem', 'MsgArchiveEcosystem', 'MsgUnarchiveEcosystem'].includes(action)

export const validParticipantAction = (action: string): action is MsgTypeParticipant =>
  [
    'MsgCancelParticipantOPLastRequest',
    'MsgRenewParticipantOP',
    'MsgSetParticipantOPToValidated',
    'MsgStartParticipantOP',
    'MsgSetParticipantEffectiveUntil',
    'MsgRevokeParticipant',
    'MsgCreateOrUpdateParticipantSession',
    'MsgSlashParticipantTrustDeposit',
    'MsgRepayParticipantSlashedTrustDeposit',
    'MsgCreateRootParticipant',
    'MsgSelfCreateParticipant',
  ].includes(action)

// Define the valid actions for CS
const validCSAction = (action: string): action is MsgTypeCS =>
  ['MsgUnarchiveCredentialSchema', 'MsgArchiveCredentialSchema', 'MsgUpdateCredentialSchema'].includes(action)

// Helper to render the correct action component
export function renderActionComponent(
  action: string,
  onClose: () => void,
  data: object,
  onRefresh?: (id?: string, txHeight?: number) => void,
  _onBack?: () => void,
  setModalHidden?: () => void
): ReactNode {
  if (action === 'GetVNATrustDeposit') {
    return <GetVNATokens />
  }
  if (validTDAction(action)) {
    return <TdActionPage action={action} data={data} onClose={onClose} onRefresh={onRefresh} />
  }
  if (validGovernanceFrameworkAction(action)) {
    return (
      <GovernanceFrameworkActionPage
        action={action}
        data={data}
        onClose={onClose}
        onRefresh={onRefresh}
        setModalHidden={setModalHidden}
      />
    )
  }
  if (validParticipantAction(action)) {
    return (
      <ParticipantActionPage
        action={action}
        data={data}
        onClose={onClose}
        onRefresh={onRefresh}
        setModalHidden={setModalHidden}
      />
    )
  }
  if (validCSAction(action)) {
    return (
      <CredentialSchemaActionPage
        action={action}
        data={data}
        onClose={onClose}
        onRefresh={onRefresh}
        setModalHidden={setModalHidden}
      />
    )
  }
  if (validEcosystemAction(action)) {
    return (
      <EcosystemActionPage
        action={action}
        data={data}
        onClose={onClose}
        onRefresh={onRefresh}
        setModalHidden={setModalHidden}
      />
    )
  }
  return null
}

export interface ActionFieldProps {
  name: string
  label: string
  value: string
  description?: string
  icon?: IconDefinition
  iconColorClass?: string
  iconClass?: string
  isWarning?: boolean
}
