'use client'

import { useChain } from '@cosmos-kit/react'
import { useCallback, useEffect, useState } from 'react'
import {
  VERANA_REST_ENDPOINT_CORPORATION,
  VERANA_REST_ENDPOINT_DELEGATION,
  VERANA_REST_ENDPOINT_GROUP,
} from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'

export interface UserCorporation {
  id: number
  policyAddress: string
  did: string
}

export interface UserCorporationResolution {
  corporation: UserCorporation | null
  hasOperatorGrant: boolean
  grantedMessageTypes: string[]
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
  const grantedMessageTypes = stringArray(authorization.msg_types, 'authorizations[0].msg_types')
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
    hasOperatorGrant: grantedMessageTypes.length > 0,
    grantedMessageTypes,
  }
}

async function resolveViaGroupMembership(address: string): Promise<UserCorporation | null> {
  if (!VERANA_REST_ENDPOINT_GROUP || !VERANA_REST_ENDPOINT_CORPORATION) {
    throw new Error('Missing V4 group or corporation endpoint')
  }
  const membershipsPayload = await fetchJson(
    `${VERANA_REST_ENDPOINT_GROUP}/corporations-by-member?account=${encodeURIComponent(address)}`,
    'Unable to resolve corporation memberships'
  )
  const membershipsEnvelope = record(membershipsPayload, 'memberships response')
  if (!Array.isArray(membershipsEnvelope.memberships)) {
    throw new Error('Invalid corporation response: missing memberships envelope')
  }
  if (membershipsEnvelope.memberships.length === 0) return null

  const membership = record(membershipsEnvelope.memberships[0], 'memberships[0]')
  const corporationId = number(membership.corporation_id, 'memberships[0].corporation_id')
  const corporationPayload = await fetchJson(
    `${VERANA_REST_ENDPOINT_CORPORATION}/get/${corporationId}`,
    'Unable to resolve corporation'
  )
  const corporationEnvelope = record(corporationPayload, 'corporation response')
  if (!('corporation' in corporationEnvelope)) {
    throw new Error('Invalid corporation response: missing corporation envelope')
  }
  return parseCorporation(corporationEnvelope.corporation, 'corporation')
}

export async function resolveUserCorporation(address: string): Promise<UserCorporationResolution> {
  const authorizationResolution = await resolveViaOperatorAuthorization(address)
  if (authorizationResolution) return authorizationResolution
  return {
    corporation: await resolveViaGroupMembership(address),
    hasOperatorGrant: false,
    grantedMessageTypes: [],
  }
}

export function useUserCorporation() {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const [corporation, setCorporation] = useState<UserCorporation | null>(null)
  const [hasOperatorGrant, setHasOperatorGrant] = useState(false)
  const [grantedMessageTypes, setGrantedMessageTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCorporation, setError] = useState<string | null>(null)

  const resolve = useCallback(async () => {
    if (!address) {
      setCorporation(null)
      setHasOperatorGrant(false)
      setGrantedMessageTypes([])
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
      setGrantedMessageTypes(resolution.grantedMessageTypes)
    } catch (error) {
      setCorporation(null)
      setHasOperatorGrant(false)
      setGrantedMessageTypes([])
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    void resolve()
  }, [resolve])

  return { corporation, hasOperatorGrant, grantedMessageTypes, loading, errorCorporation, refetch: resolve }
}
