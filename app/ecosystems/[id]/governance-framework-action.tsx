'use client'

import { useState } from 'react'
import { useActionEcosystem } from '@/msg/actions_hooks/actionEcosystem'
import type { MsgTypeEcosystem } from '@/msg/constants/notificationMsgForMsgType'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import EditableDataView from '@/ui/common/data-edit'
import type { EcosystemData } from '@/ui/dataview/datasections/ecosystem'
import {
  type GovernanceFrameworkDocumentForm,
  governanceFrameworkDocumentSections,
} from '@/ui/dataview/datasections/governance-framework-document'

interface GovernanceFrameworkActionProps {
  action: MsgTypeEcosystem
  data: object
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  setModalHidden?: () => void
}

export default function GovernanceFrameworkActionPage({
  action,
  data,
  onClose,
  onRefresh,
  setModalHidden,
}: GovernanceFrameworkActionProps) {
  const ecosystem = data as EcosystemData
  const [form, setForm] = useState<GovernanceFrameworkDocumentForm>({ docLanguage: '', docUrl: '' })
  const submitEcosystem = useActionEcosystem(onClose, onRefresh)

  async function onSave(value: GovernanceFrameworkDocumentForm) {
    setForm(value)
    if (action === 'MsgAddGovernanceFrameworkDocument') {
      await submitEcosystem({
        msgType: action,
        ecosystemId: ecosystem.id,
        currentVersion: ecosystem.lastVersion ?? ecosystem.activeVersion,
        docLanguage: value.docLanguage,
        docUrl: value.docUrl,
      })
    } else if (action === 'MsgIncreaseActiveGovernanceFrameworkVersion') {
      await submitEcosystem({ msgType: action, ecosystemId: ecosystem.id })
    }
  }

  async function onSimulate(): Promise<SimulateResult | undefined> {
    if (action !== 'MsgIncreaseActiveGovernanceFrameworkVersion') return
    const result = await submitEcosystem({ msgType: action, ecosystemId: ecosystem.id }, true)
    if (result && !('transactionHash' in result)) return result
  }

  return (
    <EditableDataView<GovernanceFrameworkDocumentForm>
      sectionsI18n={governanceFrameworkDocumentSections}
      id={action === 'MsgAddGovernanceFrameworkDocument' ? undefined : ecosystem.id}
      messageType={action}
      data={form}
      onSave={onSave}
      onSimulate={onSimulate}
      onCancel={onClose}
      noForm={action === 'MsgIncreaseActiveGovernanceFrameworkVersion'}
      setModalHidden={setModalHidden}
    />
  )
}
