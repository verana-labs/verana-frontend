'use client'

import { FingerprintIcon } from 'lucide-react'
import { useState } from 'react'
import { useActionSigning } from '@/hooks/useSigningMode'
import { useActionEcosystem } from '@/msg/actions_hooks/actionEcosystem'
import EditableDataView from '@/ui/common/data-edit'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { type EcosystemData, ecosystemSections } from '@/ui/dataview/datasections/ecosystem'
import { tr } from '@/ui/ecosystems/i18n'

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

function CreateEcosystemIntro() {
  const { mode } = useActionSigning('MsgCreateEcosystem')

  return (
    <div className="mb-5 space-y-3">
      <p className="text-sm text-muted-foreground">
        {tr('ecosystems.add.intro', 'Register a new ecosystem on Verana, controlled by your acting corporation.')}
      </p>
      {mode ? (
        <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 text-xs font-medium text-foreground [&_svg]:size-3">
          <span aria-hidden="true" className="inline-flex">
            <SigningModeIcon mode={mode} />
          </span>
          {tr(
            `corporation.signingmode.${mode}`,
            mode === 'operator' ? 'Executes directly as operator' : 'Opens a governance proposal'
          )}
        </span>
      ) : null}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <FingerprintIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {tr('ecosystems.add.sri', 'The document digest (SRI) is computed for you before signing.')}
      </p>
    </div>
  )
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
    <>
      <CreateEcosystemIntro />
      <EditableDataView<EcosystemData>
        sectionsI18n={ecosystemSections}
        id={undefined}
        messageType="MsgCreateEcosystem"
        data={data}
        onSave={onSave}
        onCancel={onCancel}
        isModal={true}
      />
    </>
  )
}
