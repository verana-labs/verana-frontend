'use client'

import { faArrowUp, faPlus } from '@fortawesome/free-solid-svg-icons'
import { useMemo, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { editableVersions, type GfOwner, type GfVersion, hasDocumentIn, nextVersion } from '@/lib/gf-document'
import { useLanguageLabel } from '@/lib/language'
import { useActionEcosystem } from '@/msg/actions_hooks/actionEcosystem'
import { EntityActionButton } from '@/ui/common/capability-button'
import EditableDataView from '@/ui/common/data-edit'
import { ModalAction } from '@/ui/common/modal-action'
import {
  type GovernanceFrameworkDocumentForm,
  governanceFrameworkDocumentSections,
} from '@/ui/dataview/datasections/governance-framework-document'
import { actionButtonClass } from '@/ui/ecosystem-detail/action-button-class'

type GovernanceFrameworkAction = 'MsgAddGovernanceFrameworkDocument' | 'MsgIncreaseActiveGovernanceFrameworkVersion'

export interface GovernanceFrameworkTarget {
  owner: GfOwner
  language: string
  activeVersion: number
  versions: GfVersion[]
}

const LABELS: Record<GfOwner['kind'], Record<GovernanceFrameworkAction, string>> = {
  ecosystem: {
    MsgAddGovernanceFrameworkDocument: 'dataview.ecosystem.actions.addGovernanceFrameworkDocument',
    MsgIncreaseActiveGovernanceFrameworkVersion: 'dataview.ecosystem.actions.increaseActiveGovernanceFrameworkVersion',
  },
  corporation: {
    MsgAddGovernanceFrameworkDocument: 'corporation.governance.add',
    MsgIncreaseActiveGovernanceFrameworkVersion: 'corporation.governance.increase',
  },
}

function GovernanceFrameworkForm({
  action,
  target,
  onClose,
  onRefresh,
}: {
  action: GovernanceFrameworkAction
  target: GovernanceFrameworkTarget
  onClose: () => void
  onRefresh: () => void
}) {
  const { versions, activeVersion, owner } = target
  const targets = useMemo(() => editableVersions(versions, activeVersion), [versions, activeVersion])
  const sections = useMemo(
    () => governanceFrameworkDocumentSections(targets, new Set(versions.map((version) => version.version))),
    [targets, versions]
  )
  const submit = useActionEcosystem(onClose, onRefresh)

  async function onSave(value: GovernanceFrameworkDocumentForm) {
    if (action === 'MsgAddGovernanceFrameworkDocument') {
      await submit({
        msgType: action,
        owner,
        targetVersion: Number(value.targetVersion),
        docLanguage: value.docLanguage,
        docUrl: value.docUrl,
      })
    } else {
      await submit({ msgType: action, owner })
    }
  }

  return (
    <EditableDataView<GovernanceFrameworkDocumentForm>
      sectionsI18n={sections}
      id={action === 'MsgAddGovernanceFrameworkDocument' ? undefined : String(owner.id)}
      messageType={action}
      data={{ targetVersion: String(targets[0]), docLanguage: '', docUrl: '' }}
      onSave={onSave}
      onCancel={onClose}
      noForm={action === 'MsgIncreaseActiveGovernanceFrameworkVersion'}
    />
  )
}

export function GovernanceFrameworkActions({
  target,
  onRefresh,
  primaryVariant = 'default',
}: {
  target: GovernanceFrameworkTarget
  onRefresh: () => void
  primaryVariant?: 'default' | 'outline'
}) {
  const [action, setAction] = useState<GovernanceFrameworkAction | null>(null)
  const languageLabel = useLanguageLabel(target.language)
  const labels = LABELS[target.owner.kind]
  const next = nextVersion(target.versions, target.activeVersion)
  const missingLanguage =
    next && !hasDocumentIn(next, target.language)
      ? translate('governance.increase.missinglanguage', {
          version: next.version,
          language: languageLabel || target.language,
        })
      : undefined

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <EntityActionButton
          msgType="MsgAddGovernanceFrameworkDocument"
          icon={faPlus}
          label={translate(labels.MsgAddGovernanceFrameworkDocument)}
          onClick={() => setAction('MsgAddGovernanceFrameworkDocument')}
          className={actionButtonClass(primaryVariant)}
        />
        {next ? (
          <EntityActionButton
            msgType="MsgIncreaseActiveGovernanceFrameworkVersion"
            icon={faArrowUp}
            label={translate(labels.MsgIncreaseActiveGovernanceFrameworkVersion)}
            blockedReason={missingLanguage}
            onClick={() => setAction('MsgIncreaseActiveGovernanceFrameworkVersion')}
            className={actionButtonClass('outline', '[&>svg:first-child]:text-success')}
          />
        ) : null}
      </div>
      <ModalAction
        isActive={action !== null}
        titleKey={labels[action ?? 'MsgAddGovernanceFrameworkDocument']}
        onClose={() => setAction(null)}
      >
        {action ? (
          <GovernanceFrameworkForm
            action={action}
            target={target}
            onClose={() => setAction(null)}
            onRefresh={onRefresh}
          />
        ) : null}
      </ModalAction>
    </>
  )
}
