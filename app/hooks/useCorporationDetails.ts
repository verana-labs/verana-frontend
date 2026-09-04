'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  VERANA_REST_ENDPOINT_CORPORATION,
  VERANA_REST_ENDPOINT_DELEGATION,
  VERANA_REST_ENDPOINT_GROUP,
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
} from '@/config/env'
import { indexerValidators } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'

const { record, string, integer, optionalString, nullableString, stringArray } = indexerValidators('corporation page')

export interface CorporationProfile {
  id: number
  did: string
  policyAddress: string
  language: string
  created: string | null
  modified: string | null
}

export interface GroupMemberRow {
  address: string
  weight: string
  addedAt: string | null
}

export interface GroupPolicy {
  threshold: string | null
  votingPeriod: string | null
  totalWeight: string
  groupId: number
}

export interface CorporationTrustDeposit {
  deposit: number
  slashedDeposit: number
  repaidDeposit: number
  slashCount: number
  lastSlashed: string | null
  lastRepaid: string | null
}

export interface OperatorAuthorizationRow {
  id: number
  operator: string
  msgTypes: string[]
}

export interface VsOperatorAuthorizationRow {
  vsOperator: string
  participantId: number | null
  msgTypes: string[]
  expiration: string | null
}

export interface ProposalRow {
  id: number
  status: string
  submitTime: string | null
  votingPeriodEnd: string | null
  executorResult: string | null
  proposers: string[]
  messages: Record<string, unknown>[]
}

export interface ActivityRow {
  id: number
  timestamp: string
  blockHeight: number
  msg: string
  account: string | null
  changes: Record<string, unknown>
}

export interface ProposalTally {
  yes: number
  no: number
  abstain: number
  veto: number
  total: number
}

export interface CorporationDetails {
  profile: CorporationProfile
  members: GroupMemberRow[]
  policy: GroupPolicy
  trustDeposit: CorporationTrustDeposit | null
  operatorAuthorizations: OperatorAuthorizationRow[]
  vsOperatorAuthorizations: VsOperatorAuthorizationRow[]
  proposals: ProposalRow[]
  history: ActivityRow[]
}

async function fetchJson(url: string, context: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${context}: ${response.status}`)
  return response.json()
}

export function parseProfile(payload: unknown): CorporationProfile {
  const envelope = record(payload, 'corporation response')
  const corporation = record(envelope.corporation, 'corporation')
  return {
    id: integer(corporation.id, 'corporation.id'),
    did: string(corporation.did, 'corporation.did'),
    policyAddress: string(corporation.policy_address, 'corporation.policy_address'),
    language: optionalString(corporation.language, 'corporation.language') ?? '',
    created: nullableString(corporation.created ?? null, 'corporation.created'),
    modified: nullableString(corporation.modified ?? null, 'corporation.modified'),
  }
}

export function parseGroup(payload: unknown): { members: GroupMemberRow[]; policy: GroupPolicy } {
  const envelope = record(payload, 'group response')
  const group = record(envelope.group, 'group')
  const members = Array.isArray(group.members) ? group.members : []
  const policy = record(group.policy, 'group.policy')
  const decision = record(policy.decision_policy, 'group.policy.decision_policy')
  const windows = record(decision.windows, 'group.policy.decision_policy.windows')
  return {
    members: members.map((entry, index) => {
      const member = record(entry, `group.members[${index}]`)
      return {
        address: string(member.address, `group.members[${index}].address`),
        weight: string(member.weight, `group.members[${index}].weight`),
        addedAt: nullableString(member.added_at ?? null, `group.members[${index}].added_at`),
      }
    }),
    policy: {
      threshold: nullableString(decision.threshold ?? null, 'group.policy.decision_policy.threshold'),
      votingPeriod: nullableString(windows.voting_period ?? null, 'group.policy.decision_policy.windows.voting_period'),
      totalWeight: string(group.total_weight, 'group.total_weight'),
      groupId: integer(group.group_id, 'group.group_id'),
    },
  }
}

export function parseTrustDeposit(payload: unknown): CorporationTrustDeposit {
  const envelope = record(payload, 'trust deposit response')
  const trustDeposit = record(envelope.trust_deposit, 'trust_deposit')
  return {
    deposit: integer(trustDeposit.deposit, 'trust_deposit.deposit'),
    slashedDeposit: integer(trustDeposit.slashed_deposit, 'trust_deposit.slashed_deposit'),
    repaidDeposit: integer(trustDeposit.repaid_deposit, 'trust_deposit.repaid_deposit'),
    slashCount: integer(trustDeposit.slash_count, 'trust_deposit.slash_count'),
    lastSlashed: nullableString(trustDeposit.last_slashed ?? null, 'trust_deposit.last_slashed'),
    lastRepaid: nullableString(trustDeposit.last_repaid ?? null, 'trust_deposit.last_repaid'),
  }
}

export function parseOperatorAuthorizations(payload: unknown): OperatorAuthorizationRow[] {
  const envelope = record(payload, 'authorizations response')
  const rows = Array.isArray(envelope.authorizations) ? envelope.authorizations : []
  return rows.map((entry, index) => {
    const row = record(entry, `authorizations[${index}]`)
    return {
      id: integer(row.id, `authorizations[${index}].id`),
      operator: string(row.operator, `authorizations[${index}].operator`),
      msgTypes: stringArray(row.msg_types, `authorizations[${index}].msg_types`),
    }
  })
}

export function parseVsOperatorAuthorizations(payload: unknown): VsOperatorAuthorizationRow[] {
  const envelope = record(payload, 'vs authorizations response')
  const rows = Array.isArray(envelope.authorizations) ? envelope.authorizations : []
  return rows.map((entry, index) => {
    const row = record(entry, `vs_authorizations[${index}]`)
    const participant = row.participant_id
    return {
      vsOperator: string(row.vs_operator ?? row.operator, `vs_authorizations[${index}].vs_operator`),
      participantId: typeof participant === 'number' ? participant : null,
      msgTypes: Array.isArray(row.msg_types) ? stringArray(row.msg_types, `vs_authorizations[${index}].msg_types`) : [],
      expiration: nullableString(row.expiration ?? null, `vs_authorizations[${index}].expiration`),
    }
  })
}

export function parseProposals(payload: unknown): ProposalRow[] {
  const envelope = record(payload, 'proposals response')
  const rows = Array.isArray(envelope.proposals) ? envelope.proposals : []
  return rows.map((entry, index) => {
    const row = record(entry, `proposals[${index}]`)
    return {
      id: integer(row.id, `proposals[${index}].id`),
      status: optionalString(row.status, `proposals[${index}].status`) ?? 'UNKNOWN',
      submitTime: nullableString(row.submit_time ?? null, `proposals[${index}].submit_time`),
      votingPeriodEnd: nullableString(row.voting_period_end ?? null, `proposals[${index}].voting_period_end`),
      executorResult: nullableString(row.executor_result ?? null, `proposals[${index}].executor_result`),
      proposers: Array.isArray(row.proposers) ? stringArray(row.proposers, `proposals[${index}].proposers`) : [],
      messages: Array.isArray(row.messages) ? row.messages.map((message) => record(message, 'proposal message')) : [],
    }
  })
}

export interface VoteRow {
  voter: string
  option: string
  submitTime: string | null
}

export async function fetchProposalVotes(proposalId: number): Promise<VoteRow[]> {
  const payload = await fetchJson(
    `${VERANA_REST_ENDPOINT_GROUP}/votes?proposal_id=${proposalId}&limit=1024`,
    'Unable to fetch votes'
  )
  const envelope = record(payload, 'votes response')
  const rows = Array.isArray(envelope.votes) ? envelope.votes : []
  return rows.map((entry, index) => {
    const row = record(entry, `votes[${index}]`)
    return {
      voter: string(row.voter, `votes[${index}].voter`),
      option: string(row.option, `votes[${index}].option`),
      submitTime: nullableString(row.submit_time ?? null, `votes[${index}].submit_time`),
    }
  })
}

function newestFirst(a: ActivityRow, b: ActivityRow): number {
  const byTime = Date.parse(b.timestamp) - Date.parse(a.timestamp)
  if (Number.isFinite(byTime) && byTime !== 0) return byTime
  return b.blockHeight - a.blockHeight || b.id - a.id
}

export function parseHistory(payload: unknown): ActivityRow[] {
  const envelope = record(payload, 'history response')
  if (!Array.isArray(envelope.activity)) throw new Error('Invalid corporation page response: history.activity')
  return envelope.activity
    .map((entry, index) => {
      const row = record(entry, `activity[${index}]`)
      const changes = row.changes
      return {
        id: integer(row.id, `activity[${index}].id`),
        timestamp: string(row.timestamp, `activity[${index}].timestamp`),
        blockHeight: integer(row.block_height, `activity[${index}].block_height`),
        msg: string(row.msg, `activity[${index}].msg`),
        account: nullableString(row.account ?? null, `activity[${index}].account`),
        changes: changes === undefined || changes === null ? {} : record(changes, `activity[${index}].changes`),
      }
    })
    .sort(newestFirst)
}

export async function fetchCorporationHistory(corporationId: number): Promise<ActivityRow[]> {
  try {
    const payload = await fetchJson(
      `${VERANA_REST_ENDPOINT_CORPORATION}/history/${corporationId}?limit=64`,
      'Unable to fetch the history'
    )
    return parseHistory(payload)
  } catch (cause) {
    logger.error('corporation history', cause)
    return []
  }
}

type VoteBucket = Exclude<keyof ProposalTally, 'total'>

const VOTE_BUCKETS = new Map<string, VoteBucket>([
  ['YES', 'yes'],
  ['NO', 'no'],
  ['ABSTAIN', 'abstain'],
  ['NO_WITH_VETO', 'veto'],
])

export function tallyVotes(votes: VoteRow[], members: GroupMemberRow[]): ProposalTally {
  const weights = new Map(members.map((member) => [member.address, Number(member.weight)]))
  const tally: ProposalTally = { yes: 0, no: 0, abstain: 0, veto: 0, total: 0 }
  for (const vote of votes) {
    const bucket = VOTE_BUCKETS.get(
      vote.option
        .trim()
        .toUpperCase()
        .replace(/^VOTE_OPTION_/, '')
    )
    if (!bucket) continue
    const weight = weights.get(vote.voter) ?? 0
    const counted = Number.isFinite(weight) ? weight : 0
    tally[bucket] += counted
    tally.total += counted
  }
  return tally
}

export function useProposalVotes(proposalIds: number[]) {
  const key = proposalIds.join(',')
  const [votes, setVotes] = useState<Record<number, VoteRow[]>>({})
  const [loading, setLoading] = useState(proposalIds.length > 0)
  const requestRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestRef.current
    const ids = key ? key.split(',').map(Number) : []
    if (ids.length === 0) {
      setVotes({})
      setLoading(false)
      return
    }
    setLoading(true)
    void Promise.all(
      ids.map((id) =>
        fetchProposalVotes(id).catch((cause: unknown) => {
          logger.error(`proposal ${id} votes`, cause)
          return [] as VoteRow[]
        })
      )
    ).then((results) => {
      if (requestRef.current !== requestId) return
      setVotes(Object.fromEntries(ids.map((id, index) => [id, results[index]])))
      setLoading(false)
    })
  }, [key])

  return { votes, loading }
}

export function useCorporationDetails(corporationId: number | undefined) {
  const [details, setDetails] = useState<CorporationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    if (corporationId === undefined) {
      setDetails(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [profilePayload, groupPayload, authPayload, proposalsPayload] = await Promise.all([
        fetchJson(`${VERANA_REST_ENDPOINT_CORPORATION}/get/${corporationId}`, 'Unable to fetch the corporation'),
        fetchJson(`${VERANA_REST_ENDPOINT_GROUP}/get/${corporationId}`, 'Unable to fetch the group'),
        fetchJson(
          `${VERANA_REST_ENDPOINT_DELEGATION}/operator-authorizations?corporation_id=${corporationId}&only_active=true&limit=1024`,
          'Unable to fetch operator authorizations'
        ),
        fetchJson(
          `${VERANA_REST_ENDPOINT_GROUP}/proposals?corporation_id=${corporationId}&limit=1024`,
          'Unable to fetch proposals'
        ),
      ])
      const [trustDeposit, vsAuthorizations, history] = await Promise.all([
        fetchJson(`${VERANA_REST_ENDPOINT_TRUST_DEPOSIT}/get/${corporationId}`, 'Unable to fetch the trust deposit')
          .then(parseTrustDeposit)
          .catch((cause: unknown) => {
            if (cause instanceof Error && cause.message.endsWith(': 404')) return null
            throw cause
          }),
        fetchJson(
          `${VERANA_REST_ENDPOINT_DELEGATION}/vs-operator-authorizations?corporation_id=${corporationId}&only_active=true&limit=1024`,
          'Unable to fetch VS operator authorizations'
        )
          .then(parseVsOperatorAuthorizations)
          .catch((cause: unknown) => {
            logger.error('vs operator authorizations', cause)
            return [] as VsOperatorAuthorizationRow[]
          }),
        fetchCorporationHistory(corporationId),
      ])
      if (requestRef.current !== requestId) return
      const { members, policy } = parseGroup(groupPayload)
      setDetails({
        profile: parseProfile(profilePayload),
        members,
        policy,
        trustDeposit,
        operatorAuthorizations: parseOperatorAuthorizations(authPayload),
        vsOperatorAuthorizations: vsAuthorizations,
        proposals: parseProposals(proposalsPayload),
        history,
      })
    } catch (cause) {
      if (requestRef.current !== requestId) return
      setDetails(null)
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (requestRef.current === requestId) setLoading(false)
    }
  }, [corporationId])

  useEffect(() => {
    void load()
  }, [load])

  return { details, loading, error, refetch: load }
}
