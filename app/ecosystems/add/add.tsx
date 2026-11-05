'use client'

import { useState } from 'react'
import { useActionEcosystem } from '@/msg/actions_hooks/actionEcosystem'
import EditableDataView from '@/ui/common/data-edit'
import { type EcosystemData, ecosystemSections } from '@/ui/dataview/datasections/ecosystem'

type AddEcosystemPageProps = {
  onCancel: () => void
  onRefresh: (id?: string, txHeight?: number) => void
}

const EMPTY_ECOSYSTEM: EcosystemData = {
  id: '',
  did: '',
  corporationId: 0,
  language: '',
  created: '',
  modified: '',
  archived: null,
  activeVersion: 0,
  activeSchemas: 0,
  participants: 0,
  weight: '0',
  issued: 0,
  verified: 0,
  versions: [],
  docUrl: '',
}

export default function AddEcosystemPage({ onCancel, onRefresh }: AddEcosystemPageProps) {
  const [data, setData] = useState(EMPTY_ECOSYSTEM)
  const submitEcosystem = useActionEcosystem(onCancel, onRefresh)

  async function onSave(value: EcosystemData) {
    setData(value)
    await submitEcosystem({
      msgType: 'MsgCreateEcosystem',
      did: value.did,
      language: value.language,
      docUrl: value.docUrl ?? '',
    })
  }

  return (
    <EditableDataView<EcosystemData>
      sectionsI18n={ecosystemSections}
      id={undefined}
      messageType="MsgCreateEcosystem"
      data={data}
      onSave={onSave}
      onCancel={onCancel}
      isModal={true}
    />
  )
}
