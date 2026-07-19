'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM } from '@/config/env'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { resolveTranslatable } from '@/ui/dataview/types'

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid ecosystem response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ecosystem response: ${path}`)
  return value
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ecosystem response: ${path}`)
  }
  return value
}

function decimalAmount(value: unknown, path: string): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)) return value
  throw new Error(`Invalid ecosystem response: ${path}`)
}

function nullableString(value: unknown, path: string): string | null {
  if (value === null) return null
  return string(value, path)
}

function parseEcosystem(value: unknown, path: string): EcosystemListItem {
  const source = record(value, path)
  return {
    id: String(number(source.id, `${path}.id`)),
    did: string(source.did, `${path}.did`),
    corporationId: number(source.corporation_id, `${path}.corporation_id`),
    created: string(source.created, `${path}.created`),
    modified: string(source.modified, `${path}.modified`),
    language: string(source.language, `${path}.language`),
    activeVersion: number(source.active_version, `${path}.active_version`),
    activeSchemas: number(source.active_schemas, `${path}.active_schemas`),
    participants: number(source.participants, `${path}.participants`),
    weight: decimalAmount(source.weight, `${path}.weight`),
    issued: number(source.issued, `${path}.issued`),
    verified: number(source.verified, `${path}.verified`),
    archived: nullableString(source.archived, `${path}.archived`),
    role: '',
  }
}

export function parseEcosystemsResponse(payload: unknown): EcosystemListItem[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.ecosystems)) {
    throw new Error('Invalid ecosystem response: missing ecosystems envelope')
  }
  return envelope.ecosystems.map((value, index) => parseEcosystem(value, `ecosystems[${index}]`))
}

export function useEcosystems(all = false, onlyActive = true) {
  const { corporation, loading: corporationLoading } = useUserCorporation()
  const corporationId = corporation?.id
  const [ecosystems, setEcosystems] = useState<EcosystemListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorEcosystems, setError] = useState<string | null>(null)

  const fetchEcosystems = useCallback(async () => {
    if (!VERANA_REST_ENDPOINT_ECOSYSTEM) {
      setError(resolveTranslatable({ key: 'error.fetch.ecosystem' }, translate) ?? 'Missing ecosystem endpoint URL')
      setLoading(false)
      return
    }
    if (!all && !corporationId) {
      setEcosystems([])
      setLoading(corporationLoading)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ response_max_size: '1024' })
      if (!all && corporationId) params.set('corporation_id', String(corporationId))
      if (onlyActive) params.set('archived', 'false')
      const response = await fetch(`${VERANA_REST_ENDPOINT_ECOSYSTEM}/list?${params.toString()}`)
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      setEcosystems(parseEcosystemsResponse(json))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [all, corporationId, corporationLoading, onlyActive])

  useEffect(() => {
    void fetchEcosystems()
  }, [fetchEcosystems])

  return { ecosystems, loading, errorEcosystems, refetch: fetchEcosystems }
}
