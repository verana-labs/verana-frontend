'use client'

import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_DELEGATION } from '@/config/env'
import { type FeeGrant, parseFeeGrants } from '@/lib/fee-grant'
import { logger } from '@/lib/logger'

export const FEE_GRANT_LOOKUP_TIMEOUT_MS = 5_000

export interface FeeGrantQuery {
  corporationId: number
  grantee: string
  msgType: string
}

export type FeeGrantLookup =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; grants: FeeGrant[] }
  | { status: 'failed' }

export function feeGrantsUrl(endpoint: string, query: FeeGrantQuery): string {
  const params = new URLSearchParams({
    grantor_corporation_id: String(query.corporationId),
    grantee: query.grantee,
    msg_type: query.msgType,
    only_active: 'true',
  })
  return `${endpoint}/fee-grants?${params.toString()}`
}

export function startFeeGrantLookup(
  endpoint: string,
  query: FeeGrantQuery,
  onSettled: (lookup: FeeGrantLookup) => void
): () => void {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FEE_GRANT_LOOKUP_TIMEOUT_MS)
  let active = true

  function settle(lookup: FeeGrantLookup): void {
    if (!active) return
    active = false
    clearTimeout(timeout)
    onSettled(lookup)
  }

  fetch(feeGrantsUrl(endpoint, query), { signal: controller.signal })
    .then(async (response) => {
      if (!response.ok) throw new Error(`fee grant lookup: ${response.status}`)
      settle({ status: 'ready', grants: parseFeeGrants((await response.json()) as unknown) })
    })
    .catch((error: unknown) => {
      if (!active) return
      logger.error('fee grant lookup', error)
      settle({ status: 'failed' })
    })

  return () => {
    active = false
    clearTimeout(timeout)
    controller.abort()
  }
}

export function useFeeGrant(query: FeeGrantQuery | null): FeeGrantLookup {
  const [lookup, setLookup] = useState<FeeGrantLookup>({ status: 'idle' })
  const corporationId = query?.corporationId
  const grantee = query?.grantee
  const msgType = query?.msgType

  useEffect(() => {
    if (corporationId === undefined || !grantee || !msgType) {
      setLookup({ status: 'idle' })
      return
    }
    if (!VERANA_REST_ENDPOINT_DELEGATION) {
      setLookup({ status: 'failed' })
      return
    }
    setLookup({ status: 'loading' })
    return startFeeGrantLookup(VERANA_REST_ENDPOINT_DELEGATION, { corporationId, grantee, msgType }, setLookup)
  }, [corporationId, grantee, msgType])

  return lookup
}
