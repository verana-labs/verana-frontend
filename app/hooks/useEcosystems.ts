'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM, VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { ecosystemRolesQuery, parseEcosystemRoles } from '@/lib/ecosystem-membership'
import { indexerValidators } from '@/lib/indexer-json'
import {
  EMPTY_WINDOW,
  firstPage,
  isPartial,
  type KeysetPaging,
  type KeysetRequest,
  type KeysetWindow,
  keysetNext,
  keysetPrev,
  keysetQuery,
  keysetWindow,
} from '@/lib/keyset'
import { logger } from '@/lib/logger'
import { parseTrustData } from '@/lib/resolverClient'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { resolveTranslatable } from '@/ui/dataview/types'

const { record, string, number, decimalAmount, nullableString } = indexerValidators('ecosystem')

function parseVersions(value: unknown, path: string): EcosystemListItem['versions'] {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Error(`Invalid ecosystem response: ${path}`)
  return value.map((entry, index) => {
    const source = record(entry, `${path}[${index}]`)
    const documents = Array.isArray(source.documents) ? source.documents : []
    return {
      id: String(number(source.id, `${path}[${index}].id`)),
      version: number(source.version, `${path}[${index}].version`),
      activeSince: nullableString(source.active_since, `${path}[${index}].active_since`),
      documents: documents.map((document, documentIndex) => {
        const doc = record(document, `${path}[${index}].documents[${documentIndex}]`)
        return {
          id: String(number(doc.id, `${path}[${index}].documents[${documentIndex}].id`)),
          url: string(doc.url, `${path}[${index}].documents[${documentIndex}].url`),
          language: string(doc.language, `${path}[${index}].documents[${documentIndex}].language`),
        }
      }),
    }
  })
}

function parseEcosystem(value: unknown, path: string): EcosystemListItem {
  const source = record(value, path)
  const did = string(source.did, `${path}.did`)
  return {
    id: String(number(source.id, `${path}.id`)),
    did,
    trust: parseTrustData(source.trust_data, did),
    corporationId: number(source.corporation_id, `${path}.corporation_id`),
    created: string(source.created, `${path}.created`),
    modified: string(source.modified, `${path}.modified`),
    language: string(source.language, `${path}.language`),
    versions: parseVersions(source.versions, `${path}.versions`),
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

export type EcosystemListScope = {
  corporationId?: number
  onlyActive: boolean
  withSchemas: boolean
}

export function ecosystemListQuery(request: KeysetRequest, scope: EcosystemListScope): URLSearchParams {
  const params = new URLSearchParams(keysetQuery(request))
  if (scope.corporationId !== undefined) params.set('participant_corporation_id', String(scope.corporationId))
  if (scope.onlyActive) params.set('archived', 'false')
  if (scope.withSchemas) params.set('min_active_schemas', '1')
  params.set('trust_data', 'full')
  return params
}

export type EcosystemListOptions = {
  all?: boolean
  onlyActive?: boolean
  pageSize?: number
}

const idOf = (ecosystem: EcosystemListItem) => Number(ecosystem.id)

async function fetchRoles(corporationId: number, ecosystem: EcosystemListItem): Promise<string> {
  if (!VERANA_REST_ENDPOINT_PARTICIPANT) return ''
  try {
    const params = ecosystemRolesQuery(corporationId, ecosystem.id)
    const response = await fetch(`${VERANA_REST_ENDPOINT_PARTICIPANT}/list?${params.toString()}`)
    if (!response.ok) throw new Error(`Unable to fetch the roles: ${response.status}`)
    return parseEcosystemRoles(await response.json()).join(',')
  } catch (cause) {
    logger.error(`ecosystem ${ecosystem.id} roles`, cause)
    return ''
  }
}

async function attachRoles(rows: EcosystemListItem[], corporationId: number | undefined): Promise<EcosystemListItem[]> {
  if (corporationId === undefined) return rows
  const roles = await Promise.all(rows.map((row) => fetchRoles(corporationId, row)))
  return rows.map((row, index) => ({ ...row, role: roles[index] }))
}

export function useEcosystems({ all = false, onlyActive = true, pageSize = 9 }: EcosystemListOptions = {}) {
  const { actingCorporation, loading: corporationLoading } = useUserCorporation()
  const corporationId = actingCorporation?.corporation.id
  const [request, setRequest] = useState<KeysetRequest>(() => firstPage(pageSize))
  const [window, setWindow] = useState<KeysetWindow<EcosystemListItem>>(EMPTY_WINDOW)
  const [loading, setLoading] = useState(true)
  const [errorEcosystems, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const fetchWindow = useCallback(
    async (target: KeysetRequest) => {
      const requestId = ++requestRef.current
      if (!VERANA_REST_ENDPOINT_ECOSYSTEM) {
        setError(resolveTranslatable({ key: 'error.fetch.ecosystem' }, translate) ?? 'Missing ecosystem endpoint URL')
        setLoading(false)
        return
      }
      if (!all && corporationId === undefined) {
        setWindow(EMPTY_WINDOW)
        setLoading(corporationLoading)
        return
      }

      setError(null)
      setLoading(true)
      try {
        const params = ecosystemListQuery(target, {
          corporationId: all ? undefined : corporationId,
          onlyActive,
          withSchemas: all,
        })
        const response = await fetch(`${VERANA_REST_ENDPOINT_ECOSYSTEM}/list?${params.toString()}`)
        const json: unknown = await response.json()
        if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        }
        const window = keysetWindow(target, parseEcosystemsResponse(json))
        const rows = await attachRoles(window.rows, corporationId)
        if (requestRef.current !== requestId) return
        setWindow({ ...window, rows })
        setRequest(target)
      } catch (error) {
        if (requestRef.current !== requestId) return
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        if (requestRef.current === requestId) setLoading(false)
      }
    },
    [all, corporationId, corporationLoading, onlyActive]
  )

  useEffect(() => {
    void fetchWindow(firstPage(pageSize))
  }, [fetchWindow, pageSize])

  const refetch = useCallback(() => fetchWindow(request), [fetchWindow, request])

  const paging = useMemo<KeysetPaging>(
    () => ({
      hasPrev: window.hasPrev,
      hasNext: window.hasNext,
      partial: isPartial(window),
      next: () => {
        const target = keysetNext(request, window, idOf)
        if (target) void fetchWindow(target)
      },
      prev: () => {
        const target = keysetPrev(request, window, idOf)
        if (target) void fetchWindow(target)
      },
    }),
    [fetchWindow, request, window]
  )

  return { ecosystems: window.rows, loading, errorEcosystems, refetch, paging }
}
