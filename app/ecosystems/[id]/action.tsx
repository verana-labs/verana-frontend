'use client'

import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import type { MsgTypeEcosystem } from '@/msg/constants/notificationMsgForMsgType'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import EditableDataView from '@/ui/common/data-edit'
import { type EcosystemData, ecosystemSections } from '@/ui/dataview/datasections/ecosystem'

interface EcosystemActionProps {
  action: MsgTypeEcosystem
  data: object
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  setModalHidden?: () => void
}

export default function EcosystemActionPage({
  action,
  onClose,
  data,
  onRefresh,
  setModalHidden,
}: EcosystemActionProps) {
  const ecosystem = data as EcosystemData
  const { submitTx } = useSubmitTxMsgTypeFromObject(onClose, onRefresh)
  const noForm = action === 'MsgArchiveEcosystem' || action === 'MsgUnarchiveEcosystem'

  async function onSave(value: object) {
    await submitTx(action, value)
  }

  async function onSimulate(value: object): Promise<SimulateResult | undefined> {
    if (!noForm) return
    const result = await submitTx(action, value, true)
    if (result && !('transactionHash' in result)) return result
  }

  return (
    <EditableDataView<EcosystemData>
      sectionsI18n={ecosystemSections}
      id={ecosystem.id}
      messageType={action}
      data={ecosystem}
      onSave={onSave}
      onSimulate={onSimulate}
      onCancel={onClose}
      noForm={noForm}
      withinView={action === 'MsgUpdateEcosystem'}
      setModalHidden={setModalHidden}
    />
  )
}
