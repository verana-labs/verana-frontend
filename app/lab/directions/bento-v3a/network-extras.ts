'use client'

import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA, VERANA_REST_ENDPOINT_STATS } from '@/config/env'
import type { RoleCount } from '@/lab/directions/bento-v3a/ui/chart-bar-mixed'
import { logger } from '@/lib/logger'

export type GlobalSnapshot = {
  participants: number
  participants_ecosystem: number
  participants_issuer_grantor: number
  participants_issuer: number
  participants_verifier_grantor: number
  participants_verifier: number
  participants_holder: number
  active_ecosystems: number
  archived_ecosystems: number
  active_schemas: number
  archived_schemas: number
  issued: number
  verified: number
  network_slash_events: number
  ecosystem_slash_events: number
}

export type SchemaSummary = {
  id: number
  ecosystem_id: number
  title: string
  description: string
  participants: number
  issued: number
  verified: number
  issuer_onboarding_mode: string
  created: string
}

function useJson<T>(url: string | undefined): T | null {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`${url} answered ${response.status}`)
        return response.json() as Promise<T>
      })
      .then(setData)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) logger.error(error)
      })
    return () => controller.abort()
  }, [url])
  return data
}

export function useGlobalSnapshot(): GlobalSnapshot | null {
  return useJson<GlobalSnapshot>(
    VERANA_REST_ENDPOINT_STATS ? `${VERANA_REST_ENDPOINT_STATS}/snapshot?entity_type=GLOBAL` : undefined
  )
}

export function useLatestSchemas(limit = 12): SchemaSummary[] | null {
  const data = useJson<{ schemas: SchemaSummary[] }>(
    VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA
      ? `${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/list?response_max_size=${limit}`
      : undefined
  )
  return data?.schemas ?? null
}

export function rolesOf(snapshot: GlobalSnapshot | null): RoleCount[] | null {
  if (!snapshot) return null
  const all: RoleCount[] = [
    { role: 'ecosystem', participants: snapshot.participants_ecosystem },
    { role: 'issuer', participants: snapshot.participants_issuer },
    { role: 'verifier', participants: snapshot.participants_verifier },
    { role: 'holder', participants: snapshot.participants_holder },
    { role: 'issuerGrantor', participants: snapshot.participants_issuer_grantor },
    { role: 'verifierGrantor', participants: snapshot.participants_verifier_grantor },
  ]
  return all.filter((r) => r.participants > 0 || ['ecosystem', 'issuer', 'verifier', 'holder'].includes(r.role))
}
