'use client'

import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import type { MsgTypeCS } from '@/msg/constants/notificationMsgForMsgType'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
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

  async function onSimulate(value: object): Promise<SimulateResult | undefined> {
    if (!noForm) return
    const result = await submitTx(action, value, true)
    if (result && !('transactionHash' in result)) return result
  }

  return (
    <EditableDataView<CredentialSchemaData>
      sectionsI18n={credentialSchemaSections}
      id={String(credentialSchema.id)}
      messageType={action}
      data={credentialSchema}
      onSave={onSave}
      onSimulate={onSimulate}
      onCancel={onClose}
      noForm={noForm}
      withinView={action === 'MsgUpdateCredentialSchema'}
      setModalHidden={setModalHidden}
    />
  )
}
