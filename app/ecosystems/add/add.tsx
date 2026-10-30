'use client'

import { FingerprintIcon } from 'lucide-react'
import { useState } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import { useActionEcosystem } from '@/msg/actions_hooks/actionEcosystem'
import EditableDataView from '@/ui/common/data-edit'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { ToneTag } from '@/ui/common/tone-tag'
import { type EcosystemData, ecosystemSections } from '@/ui/dataview/datasections/ecosystem'
import { tr } from '@/ui/ecosystems/i18n'

type AddEcosystemPageProps = {
  onCancel: () => void
  onRefresh: (id?: string, txHeight?: number) => void
  withinView?: boolean
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

export function CreateEcosystemNotes() {
  const { mode } = useActionSigning('MsgCreateEcosystem')

  return (
    <div className="flex flex-col gap-3">
      {mode ? (
        <ToneTag tone={mode === 'operator' ? 'accent' : 'info'} className="self-start">
          <span className="inline-flex items-center gap-1.5 [&_svg]:size-3">
            <span aria-hidden="true" className="inline-flex">
              <SigningModeIcon mode={mode} />
            </span>
            {tr(
              `corporation.signingmode.${mode}`,
              mode === 'operator' ? 'Executes directly as operator' : 'Opens a governance proposal'
            )}
          </span>
        </ToneTag>
      ) : null}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <FingerprintIcon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        {tr('ecosystems.add.sri', 'The document digest (SRI) is computed for you before signing.')}
      </p>
    </div>
  )
}

export default function AddEcosystemPage({ onCancel, onRefresh, withinView = false }: AddEcosystemPageProps) {
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
      isModal={!withinView}
      withinView={withinView}
    />
  )
}
