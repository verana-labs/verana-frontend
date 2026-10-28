'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { translate } from '@/i18n/dataview'
import { useNotification } from '@/providers/notification-provider'
import ActionFieldButton from '@/ui/common/action-field-button'
import EgfCard from '@/ui/common/egf-card'
import type { TreeNode } from '@/ui/common/participant-tree-types'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Stepper } from '@/ui/discover/stepper'
import { discoverText as t } from '@/ui/discover/text'
import { Shimmer } from '@/ui/motion/shimmer'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Button } from '@/ui/shadcn/button'

type JoinFlowProps = {
  ecosystemId: string
  nodeJoin: TreeNode
  onCancel: () => void
  onRefresh: (id?: string, txHeight?: number) => void
}

function joinDescriptionKey(nodeJoin: TreeNode): string {
  if (nodeJoin.onboardingAction !== 'MsgSelfCreateParticipant') return 'join.createparticipant.description.op'
  return nodeJoin.type === 'VERIFIER'
    ? 'join.createparticipant.description.open.verifier'
    : 'join.createparticipant.description.open.issuer'
}

function EgfSkeleton() {
  return (
    <div className="mb-6 space-y-4 rounded-xl p-4 ring-1 ring-foreground/10 sm:p-5">
      <div className="flex gap-3">
        <Shimmer className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-1/3" />
          <Shimmer className="h-3 w-2/3" />
        </div>
      </div>
      <Shimmer className="h-40 rounded-lg" />
      <Shimmer className="h-12 rounded-lg" />
    </div>
  )
}

export default function JoinFlow({ ecosystemId, nodeJoin, onCancel, onRefresh }: JoinFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [accepted, setAccepted] = useState(false)
  const [errorNotified, setErrorNotified] = useState(false)
  const { ecosystem, errorEcosystem } = useEcosystemData(ecosystemId)
  const { notify } = useNotification()
  const router = useRouter()
  const reduced = useReducedMotion()
  const steps = [
    { title: t('join.steps.egf'), description: t('join.acceptegf.description') },
    { title: t('join.steps.participant'), description: t(joinDescriptionKey(nodeJoin)) },
  ]
  const currentStepDescription = steps[currentStep - 1].description

  const participantData = {
    id: '',
    role: nodeJoin.type,
    validator_participant_id: nodeJoin.parentId ?? '0',
    schema_id: nodeJoin.schemaId ?? '',
    did: '',
    validator_validation_fees: nodeJoin.participant?.validation_fees,
  }

  useEffect(() => {
    if (!errorEcosystem || errorNotified) return
    void notify(errorEcosystem, 'error', resolveTranslatable({ key: 'error.fetch.ecosystem.title' }, translate))
    setErrorNotified(true)
    router.push('/ecosystems')
  }, [errorEcosystem, errorNotified, notify, router])

  const slide = {
    initial: reduced ? { opacity: 0 } : { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: -12 },
    transition: { duration: DURATION.base, ease: EASE.emphasized },
  }

  return (
    <section>
      <Stepper
        steps={steps.map(({ title }) => ({ title }))}
        activeStep={currentStep}
        label={t('join.steps.label')}
        completedLabel={t('join.steps.completed')}
        className="mb-5 rounded-xl bg-muted/40 px-4 py-3 dark:bg-muted/30"
      />
      <p className="mb-4 text-sm text-muted-foreground">{currentStepDescription}</p>
      <AnimatePresence mode="wait" initial={false}>
        {currentStep === 1 ? (
          <motion.div key="egf" {...slide}>
            {ecosystem ? (
              <EgfCard ecosystem={ecosystem} accepted={accepted} onAcceptedChange={setAccepted} />
            ) : errorEcosystem ? null : (
              <EgfSkeleton />
            )}
            {errorEcosystem ? null : (
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" size="lg" className="w-full" onClick={onCancel}>
                  {t('join.btn.cancel')}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={!ecosystem || !accepted}
                  onClick={() => {
                    if (!accepted) return
                    setCurrentStep(2)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  {t('join.btn.continue')}
                  <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="join" {...slide}>
            <ActionFieldButton
              type="button"
              data={participantData}
              field={{
                name: 'joinEcosystem',
                label: t('join.btn.join'),
                value: nodeJoin.onboardingAction ?? '',
              }}
              onClose={onCancel}
              onRefresh={onRefresh}
              isActive={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
