'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useCredentialSchemas } from '@/hooks/useCredentialSchemas'
import { useEcosystemData } from '@/hooks/useEcosystemData'
import { useParticipant } from '@/hooks/useParticipant'
import { useParticipants } from '@/hooks/useParticipants'
import { useActionSigning } from '@/hooks/useSigningMode'
import { translate } from '@/i18n/dataview'
import {
  EMPTY_SELF_CREATE_INPUT,
  getParticipantOnboardingDecision,
  type JoinableParticipantRole,
  selfCreateIssue,
} from '@/lib/participant-onboarding'
import { isNativePricing } from '@/lib/pricing-asset'
import { trustCostLines } from '@/lib/trust-costs'
import { EMPTY_VS_OPERATOR_INPUT, vsOperatorIssue } from '@/lib/vs-operator-authorization'
import {
  createdParticipantId,
  type ParticipantActionParams,
  useActionParticipant,
} from '@/msg/actions_hooks/actionParticipant'
import { proposalExecution } from '@/msg/util/tx-outcome'
import { useNotification } from '@/providers/notification-provider'
import { useProtocolParams } from '@/providers/protocol-params-context'
import { CapabilityButton } from '@/ui/common/capability-button'
import CsCard from '@/ui/common/cs-card'
import EcosystemCard from '@/ui/common/ecosystem-card'
import EgfCard from '@/ui/common/egf-card'
import { EgfViewerToggle } from '@/ui/common/egf-viewer-toggle'
import { type CreatedParticipant, JoinSuccess } from '@/ui/common/join-success'
import KeysetPagination, { ShowMoreButton } from '@/ui/common/keyset-pagination'
import { PricingNotice } from '@/ui/common/pricing-notice'
import RoleCard from '@/ui/common/role-card'
import { SelfCreateFields } from '@/ui/common/self-create-fields'
import ValidatorCard from '@/ui/common/validator-card'
import { VsOperatorFields } from '@/ui/common/vs-operator-fields'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import { rolesSchema } from '@/util/util'
import { isValidDID } from '@/util/validations'

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEPS = [
  { id: 1, title: 'Review Ecosystem', description: 'Verify the ecosystem before continuing.' },
  { id: 2, title: 'Select Credential Schema', description: 'Choose the schema you want to join.' },
  { id: 3, title: 'Select Your Role', description: 'Choose your participant role.' },
  {
    id: 4,
    title: 'Accept the Governance Framework',
    description: 'Review the active governance framework document and accept it.',
  },
  { id: 5, title: 'Select Validator', description: 'Choose the participant that will validate your request.' },
  { id: 6, title: 'Confirm and Submit', description: 'Provide the DID that will participate in the ecosystem.' },
] as const

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function isJoinableRole(role: string): role is JoinableParticipantRole {
  return ['ISSUER_GRANTOR', 'VERIFIER_GRANTOR', 'ISSUER', 'VERIFIER', 'HOLDER'].includes(role)
}

function availableRoles(schema: CredentialSchemaListItem): JoinableParticipantRole[] {
  return rolesSchema(schema.issuerOnboardingMode, schema.verifierOnboardingMode).filter(
    (role): role is JoinableParticipantRole =>
      isJoinableRole(role) && (role !== 'HOLDER' || schema.holderOnboardingMode !== null)
  )
}

export default function JoinEcosystemWizard() {
  const params = useParams<{ id: string }>()
  const ecosystemId = params?.id ?? ''
  const { notify } = useNotification()
  const { ecosystem, errorEcosystem } = useEcosystemData(ecosystemId)
  const {
    credentialSchemas,
    errorCredentialSchemas,
    hasNext: schemasHasNext,
    hasPrevious: schemasHasPrevious,
    nextPage: schemasNextPage,
    previousPage: schemasPreviousPage,
  } = useCredentialSchemas(ecosystemId, false, true)

  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [selectedSchema, setSelectedSchema] = useState<CredentialSchemaListItem | null>(null)
  const [selectedRole, setSelectedRole] = useState<JoinableParticipantRole | null>(null)
  const [acceptedGovernanceFramework, setAcceptedGovernanceFramework] = useState(false)
  const [selectedValidator, setSelectedValidator] = useState<Participant | null>(null)
  const [serviceDid, setServiceDid] = useState('')
  const [selfCreate, setSelfCreate] = useState(EMPTY_SELF_CREATE_INPUT)
  const [vsOperator, setVsOperator] = useState(EMPTY_VS_OPERATOR_INPUT)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<CreatedParticipant | null>(null)
  const { participant: createdParticipant, refetch: refetchCreated } = useParticipant(created?.id)

  const unsupportedPricing = selectedSchema !== null && !isNativePricing(selectedSchema)
  const decision = useMemo(() => {
    if (!selectedSchema || !selectedRole) return null
    if (selectedRole === 'HOLDER' && !selectedSchema.holderOnboardingMode) return null
    return getParticipantOnboardingDecision(selectedRole, {
      issuerOnboardingMode: selectedSchema.issuerOnboardingMode,
      verifierOnboardingMode: selectedSchema.verifierOnboardingMode,
      holderOnboardingMode: selectedSchema.holderOnboardingMode,
    })
  }, [selectedRole, selectedSchema])

  const validatorRole = decision?.validatorRole ?? undefined
  const {
    participants: validators,
    errorParticipants,
    hasNext: validatorsHasNext,
    loadMore: loadMoreValidators,
  } = useParticipants(selectedSchema?.id, validatorRole, undefined, {
    participantState: 'ACTIVE',
    trustData: 'full',
  })

  const joinSigning = useActionSigning(decision?.messageType ?? '')
  const protocolParams = useProtocolParams()
  const submitParticipant = useActionParticipant(undefined, (id) => {
    if (id) void refetchCreated(id)
  })
  const selfCreating = decision?.messageType === 'MsgSelfCreateParticipant'
  const selfCreateWithFees = selectedRole === 'ISSUER'
  const selfCreateProblem = selfCreating
    ? selfCreateIssue(selfCreate, selectedValidator?.effective_until, new Date(), selfCreateWithFees)
    : null
  const vsOperatorProblem = selectedRole ? vsOperatorIssue(selectedRole, vsOperator) : null
  const activeStep = STEPS.find((step) => step.id === currentStep)
  const percentage = currentStep === 7 ? 100 : ((currentStep - 1) / STEPS.length) * 100

  const canContinue = (() => {
    switch (currentStep) {
      case 1:
        return ecosystem !== null
      case 2:
        return selectedSchema !== null
      case 3:
        return selectedRole !== null && !unsupportedPricing && decision?.messageType !== null
      case 4:
        return acceptedGovernanceFramework
      case 5:
        return decision?.validatorRole === null || selectedValidator !== null
      case 6:
        return isValidDID(serviceDid) && selfCreateProblem === null && vsOperatorProblem === null && !submitting
      case 7:
        return false
    }
  })()

  const onboardingCostLines =
    decision?.messageType === 'MsgStartParticipantOP'
      ? trustCostLines(
          { msgType: 'MsgStartParticipantOP', validationFees: selectedValidator?.validation_fees },
          protocolParams
        )
      : []

  async function submit() {
    if (!decision?.messageType || !selectedRole || !selectedValidator || !isValidDID(serviceDid)) return
    const common = { role: selectedRole, validatorParticipantId: selectedValidator.id, did: serviceDid, vsOperator }
    const params: ParticipantActionParams =
      decision.messageType === 'MsgSelfCreateParticipant'
        ? {
            ...common,
            msgType: decision.messageType,
            effectiveFrom: selfCreate.effectiveFrom,
            effectiveUntil: selfCreate.effectiveUntil,
            ...(selfCreateWithFees
              ? {
                  validationFees: selfCreate.validationFees.trim(),
                  verificationFees: selfCreate.verificationFees.trim(),
                }
              : {}),
          }
        : { ...common, msgType: decision.messageType, validatorValidationFees: selectedValidator.validation_fees }
    setSubmitting(true)
    try {
      const result = await submitParticipant(params)
      if (!result || result.code !== 0 || proposalExecution(result.events).status === 'failed') return
      setCreated({
        id: createdParticipantId(params, result),
        msgType: decision.messageType,
        did: serviceDid,
        role: selectedRole,
      })
      setCurrentStep(7)
    } finally {
      setSubmitting(false)
    }
  }

  function continueWizard() {
    if (!canContinue) {
      void notify('Complete the current step before continuing.', 'error')
      return
    }
    if (currentStep === 6) {
      void submit()
      return
    }
    if (currentStep < 6) setCurrentStep((currentStep + 1) as WizardStep)
  }

  if (errorEcosystem || errorCredentialSchemas) {
    return <div className="error-pane">{errorEcosystem ?? errorCredentialSchemas}</div>
  }

  if (!ecosystem) {
    return (
      <div className="skeleton-card">
        <div className="skeleton-title mb-6 w-1/3" />
        <div className="skeleton-block h-48 rounded-lg" />
      </div>
    )
  }

  if (currentStep === 7 && created && selectedSchema) {
    return <JoinSuccess created={created} participant={createdParticipant} schemaId={selectedSchema.id} />
  }

  return (
    <>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {resolveTranslatable({ key: 'join.title' }, translate) ?? 'Join Ecosystem'}
        </h1>
        <p className="mt-2 text-sm text-neutral-70">
          {resolveTranslatable({ key: 'join.desc' }, translate) ?? 'Create a V4 participant for a credential schema.'}
        </p>
      </section>

      <section className="mb-8">
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
            <span className="text-sm font-medium text-primary-600">{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-success-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="hidden sm:flex justify-between mt-6">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center max-w-24 text-center">
                <div
                  className={classes(
                    'w-9 h-9 rounded-full flex items-center justify-center font-semibold mb-2',
                    step.id < currentStep
                      ? 'bg-success-500 text-white'
                      : step.id === currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  )}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeStep ? (
        <section className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{activeStep.title}</h2>
            <p className="text-sm text-neutral-70 mt-1">{activeStep.description}</p>
          </div>

          {currentStep === 1 ? (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="w-full">
                <EcosystemCard ecosystem={{ ...ecosystem, role: ecosystem.role ?? '' }} />
              </div>
              <EgfViewerToggle versions={ecosystem.versions} activeVersion={ecosystem.activeVersion} />
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-4 mb-6">
              {credentialSchemas.map((credentialSchema) => (
                <CsCard
                  key={credentialSchema.id}
                  credentialSchema={credentialSchema}
                  selected={selectedSchema?.id === credentialSchema.id}
                  onSelect={() => {
                    setSelectedSchema(credentialSchema)
                    setSelectedRole(null)
                    setSelectedValidator(null)
                    setAcceptedGovernanceFramework(false)
                  }}
                />
              ))}
              {credentialSchemas.length === 0 ? (
                <p className="text-sm text-neutral-70">No active credential schemas are available.</p>
              ) : null}
              <KeysetPagination
                showing={credentialSchemas.length}
                itemsLabel={resolveTranslatable({ key: 'datatable.cs.title' }, translate) ?? 'Credential Schemas'}
                hasPrevious={schemasHasPrevious}
                hasNext={schemasHasNext}
                onPrevious={schemasPreviousPage}
                onNext={schemasNextPage}
              />
            </div>
          ) : null}

          {currentStep === 3 && selectedSchema ? (
            <div className="mb-6">
              {unsupportedPricing ? <PricingNotice schema={selectedSchema} className="mb-4" /> : null}
              {availableRoles(selectedSchema).map((role) => (
                <RoleCard
                  key={role}
                  role={role}
                  selected={selectedRole === role}
                  onSelect={() => {
                    setSelectedRole(role)
                    setSelectedValidator(null)
                    setVsOperator(EMPTY_VS_OPERATOR_INPUT)
                  }}
                />
              ))}
              {selectedRole === 'HOLDER' && decision?.messageType === null ? (
                <div
                  role="status"
                  className="rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                >
                  <p className="font-semibold">{t('join.holder.permissionless.title')}</p>
                  <p className="mt-1">{t('join.holder.permissionless.text')}</p>
                  <Link href={`/participants/${selectedSchema.id}`} className="mt-2 inline-block font-medium underline">
                    {t('join.holder.permissionless.link')}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === 4 ? (
            <EgfCard
              ecosystem={ecosystem}
              accepted={acceptedGovernanceFramework}
              onAcceptedChange={setAcceptedGovernanceFramework}
            />
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-4 mb-6">
              {decision?.messageType === 'MsgSelfCreateParticipant' ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300">
                  This role uses open onboarding. Select the ecosystem participant that anchors the new participant.
                </div>
              ) : null}
              {errorParticipants ? <div className="error-pane">{errorParticipants}</div> : null}
              {decision?.validatorRole && validators.length === 0 ? (
                <p className="text-sm text-neutral-70">No active validator participant is available.</p>
              ) : null}
              {decision?.validatorRole
                ? validators.map((validator) => (
                    <ValidatorCard
                      key={validator.id}
                      validator={validator}
                      selected={selectedValidator?.id === validator.id}
                      onSelect={() => setSelectedValidator(validator)}
                    />
                  ))
                : null}
              {decision?.validatorRole && validatorsHasNext ? <ShowMoreButton onClick={loadMoreValidators} /> : null}
            </div>
          ) : null}

          {currentStep === 6 ? (
            <div className="space-y-4 mb-6">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-sm">
                <p>
                  <span className="font-medium">Schema:</span> {selectedSchema?.title}
                </p>
                <p>
                  <span className="font-medium">Role:</span> {selectedRole}
                </p>
                <p>
                  <span className="font-medium">Onboarding transaction:</span> {decision?.messageType}
                </p>
                {selectedValidator ? (
                  <p>
                    <span className="font-medium">Validator participant:</span> {selectedValidator.id}
                  </p>
                ) : null}
                {onboardingCostLines.map((line) => (
                  <p key={line.label}>
                    <span className="font-medium">{line.label}:</span> {line.value}
                  </p>
                ))}
              </div>
              <div>
                <label
                  htmlFor="service-did"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Service DID
                </label>
                <input
                  id="service-did"
                  type="text"
                  value={serviceDid}
                  onChange={(event) => setServiceDid(event.target.value)}
                  placeholder="did:method:identifier"
                  className={classes(
                    'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface text-gray-900 dark:text-white',
                    serviceDid === '' || isValidDID(serviceDid) ? 'border-neutral-20' : 'border-red-500'
                  )}
                />
              </div>
              {selfCreating ? (
                <SelfCreateFields
                  value={selfCreate}
                  onChange={setSelfCreate}
                  withFees={selfCreateWithFees}
                  issue={selfCreateProblem}
                />
              ) : null}
              {selectedRole ? (
                <VsOperatorFields
                  role={selectedRole}
                  value={vsOperator}
                  onChange={setVsOperator}
                  issue={vsOperatorProblem}
                />
              ) : null}
            </div>
          ) : null}

          <div className={classes('flex', currentStep === 1 ? 'justify-end' : 'justify-between')}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as WizardStep)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                {resolveTranslatable({ key: 'join.btn.back' }, translate) ?? 'Back'}
              </button>
            ) : null}
            {currentStep === 6 ? (
              <CapabilityButton
                signing={joinSigning}
                disabled={!canContinue}
                label={resolveTranslatable({ key: 'join.btn.join' }, translate) ?? 'Join'}
                onClick={continueWizard}
                className={classes(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
                  canContinue && !joinSigning.disabled
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                )}
              />
            ) : (
              <button
                type="button"
                onClick={continueWizard}
                disabled={!canContinue}
                className={classes(
                  'px-6 py-3 rounded-lg font-medium',
                  canContinue
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                )}
              >
                {resolveTranslatable({ key: 'join.btn.continue' }, translate) ?? 'Continue'}
              </button>
            )}
          </div>
        </section>
      ) : null}
    </>
  )
}
