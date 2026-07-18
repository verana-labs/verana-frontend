'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_ECOSYSTEM } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { EcosystemData } from '@/ui/dataview/datasections/ecosystem'
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

function parseVersions(value: unknown): EcosystemData['versions'] {
  if (!Array.isArray(value)) throw new Error('Invalid ecosystem response: ecosystem.versions')
  return value.map((entry, index) => {
    const source = record(entry, `ecosystem.versions[${index}]`)
    if (!Array.isArray(source.documents)) {
      throw new Error(`Invalid ecosystem response: ecosystem.versions[${index}].documents`)
    }
    return {
      id: String(number(source.id, `ecosystem.versions[${index}].id`)),
      version: number(source.version, `ecosystem.versions[${index}].version`),
      activeSince: nullableString(source.active_since, `ecosystem.versions[${index}].active_since`),
      documents: source.documents.map((document, documentIndex) => {
        const doc = record(document, `ecosystem.versions[${index}].documents[${documentIndex}]`)
        return {
          id: String(number(doc.id, `ecosystem.versions[${index}].documents[${documentIndex}].id`)),
          url: string(doc.url, `ecosystem.versions[${index}].documents[${documentIndex}].url`),
          language: string(doc.language, `ecosystem.versions[${index}].documents[${documentIndex}].language`),
          digestSri:
            doc.digest_sri === undefined
              ? undefined
              : string(doc.digest_sri, `ecosystem.versions[${index}].documents[${documentIndex}].digest_sri`),
        }
      }),
    }
  })
}

export function parseEcosystemResponse(payload: unknown): EcosystemData {
  const envelope = record(payload, 'response')
  if (!('ecosystem' in envelope)) {
    throw new Error('Invalid ecosystem response: missing ecosystem envelope')
  }
  const source = record(envelope.ecosystem, 'ecosystem')
  return {
    id: String(number(source.id, 'ecosystem.id')),
    did: string(source.did, 'ecosystem.did'),
    corporationId: number(source.corporation_id, 'ecosystem.corporation_id'),
    created: string(source.created, 'ecosystem.created'),
    modified: string(source.modified, 'ecosystem.modified'),
    language: string(source.language, 'ecosystem.language'),
    activeVersion: number(source.active_version, 'ecosystem.active_version'),
    activeSchemas: number(source.active_schemas, 'ecosystem.active_schemas'),
    participants: number(source.participants, 'ecosystem.participants'),
    weight: decimalAmount(source.weight, 'ecosystem.weight'),
    issued: number(source.issued, 'ecosystem.issued'),
    verified: number(source.verified, 'ecosystem.verified'),
    archived: nullableString(source.archived, 'ecosystem.archived'),
    versions: parseVersions(source.versions),
  }
}

export function useEcosystemData(id: string) {
  const [ecosystem, setEcosystem] = useState<EcosystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorEcosystem, setError] = useState<string | null>(null)

  const fetchEcosystem = useCallback(async () => {
    if (!id || !VERANA_REST_ENDPOINT_ECOSYSTEM) {
      setError(
        resolveTranslatable({ key: 'error.fetch.ecosystem' }, translate) ?? 'Missing ecosystem ID or endpoint URL'
      )
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${VERANA_REST_ENDPOINT_ECOSYSTEM}/get/${id}`)
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      setEcosystem(parseEcosystemResponse(json))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchEcosystem()
  }, [fetchEcosystem])

  return { ecosystem, loading, errorEcosystem, refetch: fetchEcosystem }
}
