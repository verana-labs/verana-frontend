'use client'

import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import type { MsgTypeCS } from '@/msg/constants/notificationMsgForMsgType'
import EditableDataView from '@/ui/common/data-edit'
import { type CredentialSchemaData, credentialSchemaSections } from '@/ui/dataview/datasections/cs'

interface CredentialSchemaActionProps {
  action: MsgTypeCS
  data: object
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  setModalHidden?: () => void
}

export default function CredentialSchemaActionPage({
  action,
  onClose,
  data,
  onRefresh,
  setModalHidden,
}: CredentialSchemaActionProps) {
  const credentialSchema = data as CredentialSchemaData
  const { submitTx } = useSubmitTxMsgTypeFromObject(onClose, onRefresh)
  const noForm = action === 'MsgArchiveCredentialSchema' || action === 'MsgUnarchiveCredentialSchema'

  async function onSave(value: object) {
    await submitTx(action, value)
  }

  return (
    <EditableDataView<CredentialSchemaData>
      sectionsI18n={credentialSchemaSections}
      id={String(credentialSchema.id)}
      messageType={action}
      data={credentialSchema}
      onSave={onSave}
      onCancel={onClose}
      noForm={noForm}
      withinView={action === 'MsgUpdateCredentialSchema'}
      setModalHidden={setModalHidden}
    />
  )
}
