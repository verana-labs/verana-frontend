'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { translate } from '@/i18n/dataview'
import { useNotification } from '@/providers/notification-provider'
import { useProtocolParams } from '@/providers/protocol-params-context'
import ActionFieldButton from '@/ui/common/action-field-button'
import EgfCard from '@/ui/common/egf-card'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import { resolveTranslatable } from '@/ui/dataview/types'

type Step = {
  id: 1 | 2
  description: string
}

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

type AddJoinPageProps = {
  ecosystemId: string
  nodeJoin: TreeNode
  onCancel: () => void
  onRefresh: (id?: string, txHeight?: number) => void
}

export default function AddJoinPage({ ecosystemId, nodeJoin, onCancel, onRefresh }: AddJoinPageProps) {
  const steps: Step[] = [
    {
      id: 1,
      description:
        resolveTranslatable({ key: 'join.acceptegf.description' }, translate) ??
        'Review and accept the Ecosystem Governance Framework before continuing.',
    },
    {
      id: 2,
      description:
        nodeJoin.onboardingAction === 'MsgSelfCreateParticipant'
          ? (resolveTranslatable(
              {
                key:
                  nodeJoin.type === 'VERIFIER'
                    ? 'join.createparticipant.description.open.verifier'
                    : 'join.createparticipant.description.open.issuer',
              },
              translate
            ) ?? 'Register this participant in the open schema.')
          : (resolveTranslatable({ key: 'join.createparticipant.description.op' }, translate) ??
            'Start the onboarding process for this participant.'),
    },
  ]
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [accepted, setAccepted] = useState(false)
  const [errorNotified, setErrorNotified] = useState(false)
  const currentStepDescription = steps.find((step) => step.id === currentStep)?.description
  const { ecosystem, errorEcosystem } = useEcosystemData(ecosystemId)
  const { notify } = useNotification()
  const router = useRouter()

  const trustDepositRate = Number(useProtocolParams().trustDepositRate)
  const validationFees = Number(nodeJoin.participant?.validation_fees)
  const transactionCost =
    Number.isFinite(trustDepositRate) && Number.isFinite(validationFees) ? (1 + trustDepositRate) * validationFees : 0
  const participantData = {
    id: '',
    role: nodeJoin.type,
    validator_participant_id: nodeJoin.parentId ?? '0',
    schema_id: nodeJoin.schemaId ?? '',
    did: '',
    transaction_cost: transactionCost > 0 ? String(transactionCost) : undefined,
  }

  useEffect(() => {
    if (!errorEcosystem || errorNotified) return
    void notify(errorEcosystem, 'error', resolveTranslatable({ key: 'error.fetch.ecosystem.title' }, translate))
    setErrorNotified(true)
    router.push('/ecosystems')
  }, [errorEcosystem, errorNotified, notify, router])

  return (
    <section>
      <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">{currentStepDescription}</p>
      {currentStep === 1 && ecosystem ? (
        <>
          <EgfCard ecosystem={ecosystem} accepted={accepted} onAcceptedChange={setAccepted} />
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              type="button"
            >
              {resolveTranslatable({ key: 'join.btn.cancel' }, translate)}
            </button>
            <button
              onClick={() => {
                if (!accepted) return
                setCurrentStep(2)
                document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={!accepted}
              className={classes(
                'px-6 py-3 rounded-lg font-medium transition-colors',
                accepted
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              )}
              type="button"
            >
              {resolveTranslatable({ key: 'join.btn.continue' }, translate)}
            </button>
          </div>
        </>
      ) : null}
      {currentStep === 2 ? (
        <ActionFieldButton
          type="button"
          data={participantData}
          field={{
            name: 'joinEcosystem',
            label: resolveTranslatable({ key: 'join.btn.join' }, translate) ?? '',
            value: nodeJoin.onboardingAction ?? '',
          }}
          onClose={onCancel}
          onRefresh={onRefresh}
          isActive={true}
        />
      ) : null}
    </section>
  )
}
