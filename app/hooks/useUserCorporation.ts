'use client'

import { useChain } from '@cosmos-kit/react'
import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT, VERANA_REST_ENDPOINT_CORPORATION, VERANA_REST_ENDPOINT_DELEGATION } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'

export interface UserCorporation {
  id: number
  policyAddress: string
  did: string
}

export interface UserCorporationResolution {
  corporation: UserCorporation | null
  hasOperatorGrant: boolean
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid corporation response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid corporation response: ${path}`)
  return value
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid corporation response: ${path}`)
  }
  return value
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`Invalid corporation response: ${path}`)
  }
  return value
}

async function fetchJson(url: string, context: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${context}: ${response.status}`)
  return response.json()
}

function parseCorporation(value: unknown, path: string): UserCorporation {
  const corporation = record(value, path)
  return {
    id: number(corporation.id, `${path}.id`),
    policyAddress: string(corporation.policy_address, `${path}.policy_address`),
    did: string(corporation.did, `${path}.did`),
  }
}

async function resolveViaOperatorAuthorization(address: string): Promise<UserCorporationResolution | null> {
  if (!VERANA_REST_ENDPOINT_DELEGATION || !VERANA_REST_ENDPOINT_CORPORATION) {
    throw new Error('Missing V4 corporation or delegation endpoint')
  }
  const authorizationsPayload = await fetchJson(
    `${VERANA_REST_ENDPOINT_DELEGATION}/operator-authorizations?operator=${encodeURIComponent(address)}&only_active=true&limit=1024`,
    'Unable to resolve operator authorizations'
  )
  const authorizationsEnvelope = record(authorizationsPayload, 'authorizations response')
  if (!Array.isArray(authorizationsEnvelope.authorizations)) {
    throw new Error('Invalid corporation response: missing authorizations envelope')
  }
  if (authorizationsEnvelope.authorizations.length === 0) return null

  const authorization = record(authorizationsEnvelope.authorizations[0], 'authorizations[0]')
  const corporationId = number(authorization.corporation_id, 'authorizations[0].corporation_id')
  const messageTypes = stringArray(authorization.msg_types, 'authorizations[0].msg_types')
  const hasOperatorGrant = OPERATOR_GRANT_MESSAGE_TYPES.every((messageType) => messageTypes.includes(messageType))
  const corporationPayload = await fetchJson(
    `${VERANA_REST_ENDPOINT_CORPORATION}/get/${corporationId}`,
    'Unable to resolve corporation'
  )
  const corporationEnvelope = record(corporationPayload, 'corporation response')
  if (!('corporation' in corporationEnvelope)) {
    throw new Error('Invalid corporation response: missing corporation envelope')
  }
  return {
    corporation: parseCorporation(corporationEnvelope.corporation, 'corporation'),
    hasOperatorGrant,
  }
}

async function resolveViaGroupMembership(address: string): Promise<UserCorporation | null> {
  if (!VERANA_REST_ENDPOINT || !VERANA_REST_ENDPOINT_CORPORATION) {
    throw new Error('Missing chain REST or V4 corporation endpoint')
  }
  const groupsPayload = await fetchJson(
    `${VERANA_REST_ENDPOINT}/cosmos/group/v1/groups_by_member/${encodeURIComponent(address)}`,
    'Unable to resolve group memberships'
  )
  const groupsEnvelope = record(groupsPayload, 'groups response')
  if (!Array.isArray(groupsEnvelope.groups)) throw new Error('Invalid corporation response: missing groups envelope')
  if (groupsEnvelope.groups.length === 0) return null

  const policyAddresses = new Set<string>()
  for (const [index, entry] of groupsEnvelope.groups.entries()) {
    const group = record(entry, `groups[${index}]`)
    const groupId = string(group.id, `groups[${index}].id`)
    const policiesPayload = await fetchJson(
      `${VERANA_REST_ENDPOINT}/cosmos/group/v1/group_policies_by_group/${groupId}`,
      'Unable to resolve group policies'
    )
    const policiesEnvelope = record(policiesPayload, `group policies response for ${groupId}`)
    if (!Array.isArray(policiesEnvelope.group_policies)) {
      throw new Error('Invalid corporation response: missing group_policies envelope')
    }
    for (const [policyIndex, policyEntry] of policiesEnvelope.group_policies.entries()) {
      const policy = record(policyEntry, `group_policies[${policyIndex}]`)
      policyAddresses.add(string(policy.address, `group_policies[${policyIndex}].address`))
    }
  }
  if (policyAddresses.size === 0) return null

  const corporationsPayload = await fetchJson(
    `${VERANA_REST_ENDPOINT_CORPORATION}/list?limit=1024&gf_data=none`,
    'Unable to resolve corporations'
  )
  const corporationsEnvelope = record(corporationsPayload, 'corporations response')
  if (!Array.isArray(corporationsEnvelope.corporations)) {
    throw new Error('Invalid corporation response: missing corporations envelope')
  }
  const corporation = corporationsEnvelope.corporations
    .map((entry, index) => parseCorporation(entry, `corporations[${index}]`))
    .find((entry) => policyAddresses.has(entry.policyAddress))
  return corporation ?? null
}

export async function resolveUserCorporation(address: string): Promise<UserCorporationResolution> {
  const authorizationResolution = await resolveViaOperatorAuthorization(address)
  if (authorizationResolution) return authorizationResolution
  return {
    corporation: await resolveViaGroupMembership(address),
    hasOperatorGrant: false,
  }
}

export function useUserCorporation() {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [corporation, setCorporation] = useState<UserCorporation | null>(null)
  const [hasOperatorGrant, setHasOperatorGrant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorCorporation, setError] = useState<string | null>(null)

  const resolve = useCallback(async () => {
    if (!address) {
      setCorporation(null)
      setHasOperatorGrant(false)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const resolution = await resolveUserCorporation(address)
      setCorporation(resolution.corporation)
      setHasOperatorGrant(resolution.hasOperatorGrant)
    } catch (error) {
      setCorporation(null)
      setHasOperatorGrant(false)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    void resolve()
  }, [resolve])

  return { corporation, hasOperatorGrant, loading, errorCorporation, refetch: resolve }
}
