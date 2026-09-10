'use client'

import { useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_DELEGATION } from '@/config/env'
import { type FeeGrant, parseFeeGrants } from '@/lib/fee-grant'
import { logger } from '@/lib/logger'

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

export function useFeeGrant(query: FeeGrantQuery | null): FeeGrantLookup {
  const [lookup, setLookup] = useState<FeeGrantLookup>({ status: 'idle' })
  const requestRef = useRef(0)
  const corporationId = query?.corporationId
  const grantee = query?.grantee
  const msgType = query?.msgType

  useEffect(() => {
    const request = ++requestRef.current
    if (corporationId === undefined || !grantee || !msgType) {
      setLookup({ status: 'idle' })
      return
    }
    if (!VERANA_REST_ENDPOINT_DELEGATION) {
      setLookup({ status: 'failed' })
      return
    }
    setLookup({ status: 'loading' })
    fetch(feeGrantsUrl(VERANA_REST_ENDPOINT_DELEGATION, { corporationId, grantee, msgType }))
      .then(async (response) => {
        if (!response.ok) throw new Error(`fee grant lookup: ${response.status}`)
        return (await response.json()) as unknown
      })
      .then((payload) => {
        if (request === requestRef.current) setLookup({ status: 'ready', grants: parseFeeGrants(payload) })
      })
      .catch((error: unknown) => {
        logger.error('fee grant lookup', error)
        if (request === requestRef.current) setLookup({ status: 'failed' })
      })
  }, [corporationId, grantee, msgType])

  return lookup
}
