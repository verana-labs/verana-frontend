import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBan,
  faCheck,
  faClockRotateLeft,
  faHandHoldingDollar,
  faRotate,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import type { MessageType } from '@/msg/constants/types'
import type { Field, Section } from '@/ui/dataview/types'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatVNAFromUVNA } from '@/util/util'

const t = (key: string) => ({ key })

export type ParticipantRole = 'ECOSYSTEM' | 'ISSUER_GRANTOR' | 'VERIFIER_GRANTOR' | 'ISSUER' | 'VERIFIER' | 'HOLDER'

export type ParticipantState = 'REPAID' | 'SLASHED' | 'REVOKED' | 'EXPIRED' | 'ACTIVE' | 'FUTURE' | 'INACTIVE'

export type OnboardingProcessState = 'PENDING' | 'VALIDATED' | 'TERMINATED'

export interface ParticipantData {
  id?: string | number
  schemaId?: string | number
  validatorParticipantId?: string | number
  role?: ParticipantRole | number
  did?: string
  effectiveFrom?: string | Date
  effectiveUntil?: string | Date
  validationFees?: string | number
  issuanceFees?: string | number
  verificationFees?: string | number
  issuanceFeeDiscount?: string | number
  verificationFeeDiscount?: string | number
  opSummaryDigest?: string
  issuerParticipantId?: string | number
  verifierParticipantId?: string | number
  agentParticipantId?: string | number
  walletAgentParticipantId?: string | number
  digest?: string
  amount?: string | number
  reason?: string
}

function identityFields(): Field<ParticipantData>[] {
  return [
    {
      name: 'id',
      label: t('dataview.participant.fields.id'),
      type: 'data',
      inputType: 'text',
      show: 'none',
      required: true,
      update: false,
    },
  ]
}

function dateFields(options: { from?: boolean; until?: boolean } = {}): Field<ParticipantData>[] {
  const fields: Field<ParticipantData>[] = []
  if (options.from) {
    fields.push({
      name: 'effectiveFrom',
      label: t('dataview.participant.fields.effectiveFrom'),
      type: 'data',
      inputType: 'date',
      show: 'edit create',
      required: false,
      update: true,
    })
  }
  if (options.until) {
    fields.push({
      name: 'effectiveUntil',
      label: t('dataview.participant.fields.effectiveUntil'),
      type: 'data',
      inputType: 'date',
      show: 'edit create',
      required: false,
      update: true,
    })
  }
  return fields
}

function feeFields(includeIssuance: boolean): Field<ParticipantData>[] {
  const fields: Field<ParticipantData>[] = [
    {
      name: 'validationFees',
      label: t('dataview.participant.fields.validationFees'),
      type: 'data',
      inputType: 'number',
      show: 'edit create',
      required: false,
      update: true,
      validation: { type: 'Long', greaterThanOrEqual: 0 },
    },
  ]
  if (includeIssuance) {
    fields.push({
      name: 'issuanceFees',
      label: t('dataview.participant.fields.issuanceFees'),
      type: 'data',
      inputType: 'number',
      show: 'edit create',
      required: false,
      update: true,
      validation: { type: 'Long', greaterThanOrEqual: 0 },
    })
  }
  fields.push({
    name: 'verificationFees',
    label: t('dataview.participant.fields.verificationFees'),
    type: 'data',
    inputType: 'number',
    show: 'edit create',
    required: false,
    update: true,
    validation: { type: 'Long', greaterThanOrEqual: 0 },
  })
  return fields
}

function createFields(options: { role?: boolean; validator?: boolean }): Field<ParticipantData>[] {
  const fields: Field<ParticipantData>[] = [
    {
      name: 'schemaId',
      label: t('dataview.participant.fields.schemaId'),
      type: 'data',
      inputType: 'text',
      show: 'none',
      required: true,
      update: false,
    },
    {
      name: 'did',
      label: t('dataview.participant.fields.did'),
      type: 'data',
      inputType: 'text',
      show: 'create',
      required: true,
      update: false,
      placeholder: 'did:method:identifier',
      validation: { type: 'DID' },
    },
  ]
  if (options.role) {
    fields.push({
      name: 'role',
      label: t('dataview.participant.fields.role'),
      type: 'data',
      show: 'none',
      required: true,
      update: false,
    })
  }
  if (options.validator) {
    fields.push({
      name: 'validatorParticipantId',
      label: t('dataview.participant.fields.validatorParticipantId'),
      type: 'data',
      show: 'none',
      required: true,
      update: false,
    })
  }
  return fields
}

export function getParticipantActionSections(
  messageType: MessageType,
  excludeFees = false
): Section<ParticipantData>[] {
  const section = (fields: Field<ParticipantData>[]): Section<ParticipantData>[] => [
    { name: t('dataview.participant.sections.main'), type: 'basic', fields },
  ]

  switch (messageType) {
    case 'MsgStartParticipantOP':
      return section([...identityFields(), ...createFields({ role: true, validator: true })])
    case 'MsgSelfCreateParticipant':
      return section([
        ...identityFields(),
        ...createFields({ role: true, validator: false }),
        ...dateFields({ from: true, until: true }),
        ...(excludeFees ? [] : feeFields(false)),
      ])
    case 'MsgCreateRootParticipant':
      return section([
        ...identityFields(),
        ...createFields({ role: false, validator: false }),
        ...dateFields({ from: true, until: true }),
        ...feeFields(true),
      ])
    case 'MsgSetParticipantOPToValidated':
      return section([
        ...identityFields(),
        ...dateFields({ until: true }),
        ...(excludeFees ? [] : feeFields(true)),
        {
          name: 'opSummaryDigest',
          label: t('dataview.participant.fields.opSummaryDigest'),
          type: 'data',
          inputType: 'text',
          show: 'edit',
          required: false,
          update: true,
        },
      ])
    case 'MsgSetParticipantEffectiveUntil':
      return section([...identityFields(), ...dateFields({ until: true })])
    case 'MsgCreateOrUpdateParticipantSession':
      return section([
        ...identityFields(),
        ...(
          ['issuerParticipantId', 'verifierParticipantId', 'agentParticipantId', 'walletAgentParticipantId'] as const
        ).map((name) => ({
          name,
          label: t(`dataview.participant.fields.${name}`),
          type: 'data' as const,
          inputType: 'number' as const,
          show: 'edit' as const,
          required: false,
          update: true,
        })),
        {
          name: 'digest',
          label: t('dataview.participant.fields.digest'),
          type: 'data',
          inputType: 'text',
          show: 'edit',
          required: true,
          update: true,
        },
      ])
    case 'MsgSlashParticipantTrustDeposit':
      return section([
        ...identityFields(),
        {
          name: 'amount',
          label: t('dataview.participant.fields.amount'),
          type: 'data',
          inputType: 'number',
          show: 'edit',
          required: true,
          update: true,
          validation: { type: 'Long', greaterThan: 0 },
        },
        {
          name: 'reason',
          label: t('dataview.participant.fields.reason'),
          type: 'data',
          inputType: 'text',
          show: 'edit',
          required: true,
          update: true,
        },
      ])
    default:
      return []
  }
}

export interface Participant {
  id: string
  schema_id: string
  role: ParticipantRole
  did: string | null
  corporation_id: number
  participant_state: ParticipantState
  corporation_available_actions: string[]
  validator_available_actions: string[]
  vs_operator?: string | null
  created?: string
  modified?: string
  adjusted?: string | null
  slashed?: string | null
  repaid?: string | null
  revoked?: string | null
  effective_from?: string | null
  effective_until?: string | null
  validation_fees?: string | number
  issuance_fees?: string | number
  verification_fees?: string | number
  issuance_fee_discount?: string | number
  verification_fee_discount?: string | number
  deposit?: string | number
  slashed_deposit?: string | number
  repaid_deposit?: string | number
  validator_participant_id?: string | null
  op_state?: OnboardingProcessState | null
  op_last_state_change?: string | null
  op_current_fees?: string | number
  op_current_deposit?: string | number
  op_summary_digest?: string | null
  op_exp?: string | null
  op_validator_deposit?: string | number
  participants?: string | number
  weight?: string | number
  issued?: string | number
  verified?: string | number
  expire_soon?: boolean | null
  transaction_cost?: string
}

export interface ParticipantHistory {
  entity_id: string
  entity_type: string
  timestamp: string
  block_height: number
  msg: string
  changes: Record<string, unknown> | null
  account: string
}

export type ParticipantAction = {
  name?: string
  value?: string
  visualizerTarget?: 'account' | 'did' | 'participant'
  icon: IconDefinition
  label: string
  iconColorClass?: string
}

export type ParticipantItem = {
  label: string
  attr: keyof Participant
  mono?: boolean
  extraActions?: ParticipantAction[]
  format?: (value: Participant[keyof Participant]) => ReactNode
  hiddenZero?: boolean
}

export const participantSlashing: ParticipantItem[] = [
  {
    label: resolveTranslatable({ key: 'participantcard.slashing.slasheddeposit' }, translate) ?? 'Slashed Deposit',
    attr: 'slashed_deposit',
    format: (value) => formatVNAFromUVNA(String(value)),
    mono: true,
    hiddenZero: true,
  },
  {
    label: resolveTranslatable({ key: 'participantcard.slashing.repaiddeposit' }, translate) ?? 'Repaid Deposit',
    attr: 'repaid_deposit',
    format: (value) => formatVNAFromUVNA(String(value)),
    mono: true,
    hiddenZero: true,
  },
]

export const participantSlashingActions: ParticipantAction[] = [
  {
    name: 'SlashParticipantTrustDeposit',
    value: 'MsgSlashParticipantTrustDeposit',
    icon: faTriangleExclamation,
    label: resolveTranslatable({ key: 'participantcard.slashing.action.slash' }, translate) ?? 'Slash Deposit',
    iconColorClass: 'bg-red-600 hover:bg-red-700',
  },
  {
    name: 'RepayParticipantSlashedTrustDeposit',
    value: 'MsgRepayParticipantSlashedTrustDeposit',
    icon: faHandHoldingDollar,
    label: resolveTranslatable({ key: 'participantcard.slashing.action.repay' }, translate) ?? 'Repay Slashed Deposit',
    iconColorClass: 'bg-green-600 hover:bg-green-700',
  },
]

export const participantLifecycleActions: ParticipantAction[] = [
  {
    name: 'SetParticipantEffectiveUntil',
    value: 'MsgSetParticipantEffectiveUntil',
    icon: faClockRotateLeft,
    label: resolveTranslatable({ key: 'participantcard.lifecycle.action.adjust' }, translate) ?? 'Adjust Participant',
  },
  {
    name: 'RevokeParticipant',
    value: 'MsgRevokeParticipant',
    icon: faBan,
    label: resolveTranslatable({ key: 'participantcard.lifecycle.action.revoke' }, translate) ?? 'Revoke Participant',
    iconColorClass: 'bg-red-600 hover:bg-red-700',
  },
  ...participantSlashingActions,
]

export const participantOnboardingActions: ParticipantAction[] = [
  {
    name: 'RenewParticipantOP',
    value: 'MsgRenewParticipantOP',
    icon: faRotate,
    label:
      resolveTranslatable({ key: 'participantcard.onboarding.action.renew' }, translate) ?? 'Renew Onboarding Process',
  },
  {
    name: 'CancelParticipantOPLastRequest',
    value: 'MsgCancelParticipantOPLastRequest',
    icon: faXmark,
    label: resolveTranslatable({ key: 'participantcard.onboarding.action.cancel' }, translate) ?? 'Cancel Request',
    iconColorClass: 'bg-gray-600 hover:bg-gray-700',
  },
  {
    name: 'SetParticipantOPtoValidated',
    value: 'MsgSetParticipantOPToValidated',
    icon: faCheck,
    label:
      resolveTranslatable({ key: 'participantcard.onboarding.action.validate' }, translate) ?? 'Accept and Validate',
    iconColorClass: 'bg-green-600 hover:bg-green-700',
  },
]

export const participantBusinessModels: ParticipantItem[] = [
  {
    label:
      resolveTranslatable({ key: 'participantcard.businessmodels.validationfees' }, translate) ?? 'Validation Fees',
    attr: 'validation_fees',
    format: (value) => formatVNAFromUVNA(String(value)),
    mono: true,
  },
  {
    label: resolveTranslatable({ key: 'participantcard.businessmodels.issuancefees' }, translate) ?? 'Issuance Fees',
    attr: 'issuance_fees',
    format: (value) => formatVNAFromUVNA(String(value)),
    mono: true,
  },
  {
    label:
      resolveTranslatable({ key: 'participantcard.businessmodels.verificationfees' }, translate) ?? 'Verification Fees',
    attr: 'verification_fees',
    format: (value) => formatVNAFromUVNA(String(value)),
    mono: true,
  },
]

export interface PendingEcosystem {
  id: string
  did: string | null
  pending_tasks: number
  participants: number
  schemas: {
    id: string
    title: string
    description: string | null
    pending_tasks: number
    pending_participants: Participant[]
  }[]
}
