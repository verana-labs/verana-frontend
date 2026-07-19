'use client'

import deepEqual from 'fast-deep-equal'
import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type {
  OnboardingProcessState,
  Participant,
  ParticipantRole,
  ParticipantState,
} from '@/ui/dataview/datasections/participant'

const PARTICIPANT_ROLES = new Set<ParticipantRole>([
  'ECOSYSTEM',
  'ISSUER_GRANTOR',
  'VERIFIER_GRANTOR',
  'ISSUER',
  'VERIFIER',
  'HOLDER',
])
const PARTICIPANT_STATES = new Set<ParticipantState>([
  'REPAID',
  'SLASHED',
  'REVOKED',
  'EXPIRED',
  'ACTIVE',
  'FUTURE',
  'INACTIVE',
])
const OP_STATES = new Set<OnboardingProcessState>(['PENDING', 'VALIDATED', 'TERMINATED'])

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid participant response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid participant response: ${path}`)
  return value
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid participant response: ${path}`)
  }
  return value
}

function nullableString(value: unknown, path: string): string | null {
  if (value === null) return null
  return string(value, path)
}

function strings(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    throw new Error(`Invalid participant response: ${path}`)
  }
  return value
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined
  return string(value, path)
}

function optionalNullableString(value: unknown, path: string): string | null | undefined {
  if (value === undefined) return undefined
  return nullableString(value, path)
}

function optionalAmount(value: unknown, path: string): string | number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`Invalid participant response: ${path}`)
  }
  return value
}

function optionalNullableBoolean(value: unknown, path: string): boolean | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'boolean') throw new Error(`Invalid participant response: ${path}`)
  return value
}

export function parseParticipantRecord(value: unknown, path = 'participant'): Participant {
  const source = record(value, path)
  const role = string(source.role, `${path}.role`) as ParticipantRole
  const state = string(source.participant_state, `${path}.participant_state`) as ParticipantState
  if (!PARTICIPANT_ROLES.has(role)) throw new Error(`Invalid participant response: ${path}.role`)
  if (!PARTICIPANT_STATES.has(state)) throw new Error(`Invalid participant response: ${path}.participant_state`)

  const opStateValue = source.op_state
  let opState: OnboardingProcessState | null | undefined
  if (opStateValue === null) {
    opState = null
  } else if (opStateValue !== undefined) {
    opState = string(opStateValue, `${path}.op_state`) as OnboardingProcessState
    if (!OP_STATES.has(opState)) throw new Error(`Invalid participant response: ${path}.op_state`)
  }

  return {
    id: String(number(source.id, `${path}.id`)),
    schema_id: String(number(source.schema_id, `${path}.schema_id`)),
    role,
    did: nullableString(source.did, `${path}.did`),
    corporation_id: number(source.corporation_id, `${path}.corporation_id`),
    participant_state: state,
    corporation_available_actions: strings(
      source.corporation_available_actions,
      `${path}.corporation_available_actions`
    ),
    validator_available_actions: strings(source.validator_available_actions, `${path}.validator_available_actions`),
    vs_operator: optionalNullableString(source.vs_operator, `${path}.vs_operator`),
    created: optionalString(source.created, `${path}.created`),
    modified: optionalString(source.modified, `${path}.modified`),
    adjusted: optionalNullableString(source.adjusted, `${path}.adjusted`),
    slashed: optionalNullableString(source.slashed, `${path}.slashed`),
    repaid: optionalNullableString(source.repaid, `${path}.repaid`),
    revoked: optionalNullableString(source.revoked, `${path}.revoked`),
    effective_from: optionalNullableString(source.effective_from, `${path}.effective_from`),
    effective_until: optionalNullableString(source.effective_until, `${path}.effective_until`),
    validation_fees: optionalAmount(source.validation_fees, `${path}.validation_fees`),
    issuance_fees: optionalAmount(source.issuance_fees, `${path}.issuance_fees`),
    verification_fees: optionalAmount(source.verification_fees, `${path}.verification_fees`),
    issuance_fee_discount: optionalAmount(source.issuance_fee_discount, `${path}.issuance_fee_discount`),
    verification_fee_discount: optionalAmount(source.verification_fee_discount, `${path}.verification_fee_discount`),
    deposit: optionalAmount(source.deposit, `${path}.deposit`),
    slashed_deposit: optionalAmount(source.slashed_deposit, `${path}.slashed_deposit`),
    repaid_deposit: optionalAmount(source.repaid_deposit, `${path}.repaid_deposit`),
    validator_participant_id:
      source.validator_participant_id === undefined || source.validator_participant_id === null
        ? source.validator_participant_id
        : String(number(source.validator_participant_id, `${path}.validator_participant_id`)),
    op_state: opState,
    op_last_state_change: optionalNullableString(source.op_last_state_change, `${path}.op_last_state_change`),
    op_current_fees: optionalAmount(source.op_current_fees, `${path}.op_current_fees`),
    op_current_deposit: optionalAmount(source.op_current_deposit, `${path}.op_current_deposit`),
    op_summary_digest: optionalNullableString(source.op_summary_digest, `${path}.op_summary_digest`),
    op_exp: optionalNullableString(source.op_exp, `${path}.op_exp`),
    op_validator_deposit: optionalAmount(source.op_validator_deposit, `${path}.op_validator_deposit`),
    participants: optionalAmount(source.participants, `${path}.participants`),
    weight: optionalAmount(source.weight, `${path}.weight`),
    issued: optionalAmount(source.issued, `${path}.issued`),
    verified: optionalAmount(source.verified, `${path}.verified`),
    expire_soon: optionalNullableBoolean(source.expire_soon, `${path}.expire_soon`),
  }
}

export function parseParticipantResponse(payload: unknown): Participant {
  const envelope = record(payload, 'response')
  if (!('participant' in envelope)) {
    throw new Error('Invalid participant response: missing participant envelope')
  }
  return parseParticipantRecord(envelope.participant)
}

export function mergeParticipantDetailActions(current: Participant, refreshed: Participant): Participant {
  const sameActionState =
    current.id === refreshed.id &&
    current.participant_state === refreshed.participant_state &&
    current.op_state === refreshed.op_state &&
    current.validator_participant_id === refreshed.validator_participant_id &&
    current.effective_from === refreshed.effective_from &&
    current.effective_until === refreshed.effective_until &&
    current.op_exp === refreshed.op_exp &&
    current.revoked === refreshed.revoked &&
    current.slashed === refreshed.slashed &&
    current.repaid === refreshed.repaid

  if (!sameActionState) return refreshed

  const merged = {
    ...refreshed,
    corporation_available_actions: current.corporation_available_actions,
    validator_available_actions: current.validator_available_actions,
  }

  return deepEqual(current, merged) ? current : merged
}

export async function refreshParticipantSources(
  id: string,
  refetchDetail: (id: string) => void | Promise<void>,
  refetchList?: () => void | Promise<void>,
  refetchHistory?: (id: string) => void | Promise<void>
): Promise<void> {
  await Promise.all([
    Promise.resolve(refetchDetail(id)),
    Promise.resolve(refetchList?.()),
    Promise.resolve(refetchHistory?.(id)),
  ])
}

export function useParticipant(id?: string) {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorParticipant, setError] = useState<string | null>(null)

  const fetchParticipant = useCallback(
    async (idOverride?: string) => {
      const participantId = idOverride ?? id
      if (!participantId || !VERANA_REST_ENDPOINT_PARTICIPANT) {
        setParticipant(null)
        setLoading(false)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const response = await fetch(`${VERANA_REST_ENDPOINT_PARTICIPANT}/get/${participantId}`)
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        setParticipant(parseParticipantResponse(json))
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    if (id) void fetchParticipant(id)
  }, [fetchParticipant, id])

  return { participant, loading, errorParticipant, refetch: fetchParticipant }
}
