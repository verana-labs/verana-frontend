'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM } from '@/config/env'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { applyKeysetParams, indexerValidators, takeKeysetPage } from '@/lib/indexer-json'
import { enrichmentFromTrustData } from '@/lib/resolverClient'
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
    trustData: enrichmentFromTrustData(did, source.trust_data),
  }
}

export function parseEcosystemsResponse(payload: unknown): EcosystemListItem[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.ecosystems)) {
    throw new Error('Invalid ecosystem response: missing ecosystems envelope')
  }
  return envelope.ecosystems.map((value, index) => parseEcosystem(value, `ecosystems[${index}]`))
}

export const ECOSYSTEMS_PAGE_SIZE = 9

export function useEcosystems(all = false, onlyActive = true, pageSize = ECOSYSTEMS_PAGE_SIZE) {
  const { actingCorporation, loading: corporationLoading } = useUserCorporation()
  const corporationId = actingCorporation?.corporation.id
  const [ecosystems, setEcosystems] = useState<EcosystemListItem[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorEcosystems, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  // The stack holds one `after` id per visited page, so the previous page needs no reverse query.
  const pageKey = `${all}|${corporationId ?? ''}|${onlyActive}|${pageSize}`
  const [pages, setPages] = useState<{ key: string; stack: (string | undefined)[] }>({
    key: pageKey,
    stack: [undefined],
  })
  const stack = pages.key === pageKey ? pages.stack : [undefined]
  const after = stack[stack.length - 1]

  const fetchEcosystems = useCallback(async () => {
    const request = ++requestRef.current
    if (!VERANA_REST_ENDPOINT_ECOSYSTEM) {
      setError(resolveTranslatable({ key: 'error.fetch.ecosystem' }, translate) ?? 'Missing ecosystem endpoint URL')
      setLoading(false)
      return
    }
    if (!all && !corporationId) {
      setEcosystems([])
      setHasNext(false)
      setLoading(corporationLoading)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ trust_data: 'full' })
      applyKeysetParams(params, { pageSize, after })
      if (!all && corporationId) params.set('participant_corporation_id', String(corporationId))
      if (onlyActive) params.set('archived', 'false')
      const response = await fetch(`${VERANA_REST_ENDPOINT_ECOSYSTEM}/list?${params.toString()}`)
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      const page = takeKeysetPage(parseEcosystemsResponse(json), pageSize)
      if (request === requestRef.current) {
        setEcosystems(page.items)
        setHasNext(page.hasNext)
      }
    } catch (error) {
      if (request === requestRef.current) setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
  }, [after, all, corporationId, corporationLoading, onlyActive, pageSize])

  useEffect(() => {
    void fetchEcosystems()
  }, [fetchEcosystems])

  const nextPage = useCallback(() => {
    const last = ecosystems[ecosystems.length - 1]
    if (last) setPages({ key: pageKey, stack: [...stack, last.id] })
  }, [ecosystems, pageKey, stack])

  const previousPage = useCallback(() => {
    if (stack.length > 1) setPages({ key: pageKey, stack: stack.slice(0, -1) })
  }, [pageKey, stack])

  return {
    ecosystems,
    loading,
    errorEcosystems,
    refetch: fetchEcosystems,
    hasNext,
    hasPrevious: stack.length > 1,
    nextPage,
    previousPage,
  }
}
