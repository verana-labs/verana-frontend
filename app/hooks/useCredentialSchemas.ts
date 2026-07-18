'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { HolderOnboardingMode, ParticipantOnboardingMode } from '@/lib/participant-onboarding'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import { resolveTranslatable } from '@/ui/dataview/types'

const ONBOARDING_MODES = new Set(['OPEN', 'ECOSYSTEM_ONBOARDING_PROCESS', 'GRANTOR_ONBOARDING_PROCESS'])
const HOLDER_ONBOARDING_MODES = new Set(['ISSUER_ONBOARDING_PROCESS', 'PERMISSIONLESS'])

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid credential schema response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid credential schema response: ${path}`)
  return value
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid credential schema response: ${path}`)
  }
  return value
}

function decimalAmount(value: unknown, path: string): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)) return value
  throw new Error(`Invalid credential schema response: ${path}`)
}

function onboardingMode(value: unknown, path: string): ParticipantOnboardingMode {
  const mode = string(value, path)
  if (!ONBOARDING_MODES.has(mode)) throw new Error(`Invalid credential schema response: ${path}`)
  return mode as ParticipantOnboardingMode
}

function holderOnboardingMode(value: unknown, path: string): HolderOnboardingMode | null {
  if (value === null) return null
  const mode = string(value, path)
  if (!HOLDER_ONBOARDING_MODES.has(mode)) throw new Error(`Invalid credential schema response: ${path}`)
  return mode as HolderOnboardingMode
}

function nullableString(value: unknown, path: string): string | null {
  if (value === null) return null
  return string(value, path)
}

function schemaMetadata(jsonSchema: string): { title: string; description: string } {
  try {
    const parsed: unknown = JSON.parse(jsonSchema)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { title: '', description: '' }
    const values = parsed as Record<string, unknown>
    return {
      title: typeof values.title === 'string' ? values.title : '',
      description: typeof values.description === 'string' ? values.description : '',
    }
  } catch {
    return { title: '', description: '' }
  }
}

function parseCredentialSchema(value: unknown, path: string): CredentialSchemaListItem {
  const source = record(value, path)
  const jsonSchema = string(source.json_schema, `${path}.json_schema`)
  const metadata = schemaMetadata(jsonSchema)
  return {
    id: String(number(source.id, `${path}.id`)),
    ecosystemId: String(number(source.ecosystem_id, `${path}.ecosystem_id`)),
    jsonSchema,
    issuerGrantorValidationValidityPeriod: number(
      source.issuer_grantor_validation_validity_period,
      `${path}.issuer_grantor_validation_validity_period`
    ),
    verifierGrantorValidationValidityPeriod: number(
      source.verifier_grantor_validation_validity_period,
      `${path}.verifier_grantor_validation_validity_period`
    ),
    issuerValidationValidityPeriod: number(
      source.issuer_validation_validity_period,
      `${path}.issuer_validation_validity_period`
    ),
    verifierValidationValidityPeriod: number(
      source.verifier_validation_validity_period,
      `${path}.verifier_validation_validity_period`
    ),
    holderValidationValidityPeriod: number(
      source.holder_validation_validity_period,
      `${path}.holder_validation_validity_period`
    ),
    issuerOnboardingMode: onboardingMode(source.issuer_onboarding_mode, `${path}.issuer_onboarding_mode`),
    verifierOnboardingMode: onboardingMode(source.verifier_onboarding_mode, `${path}.verifier_onboarding_mode`),
    holderOnboardingMode: holderOnboardingMode(source.holder_onboarding_mode, `${path}.holder_onboarding_mode`),
    title: typeof source.title === 'string' ? source.title : metadata.title,
    description: typeof source.description === 'string' ? source.description : metadata.description,
    participants: number(source.participants, `${path}.participants`),
    issuedCredentials: number(source.issued, `${path}.issued`),
    verifiedCredentials: number(source.verified, `${path}.verified`),
    weight: decimalAmount(source.weight, `${path}.weight`),
    archived: nullableString(source.archived, `${path}.archived`),
    role: '',
  }
}

export function parseCredentialSchemasResponse(payload: unknown): CredentialSchemaListItem[] {
  const envelope = record(payload, 'response')
  if (!Array.isArray(envelope.schemas)) {
    throw new Error('Invalid credential schema response: missing schemas envelope')
  }
  return envelope.schemas.map((value, index) => parseCredentialSchema(value, `schemas[${index}]`))
}

export function useCredentialSchemas(ecosystemId?: string, all = true, onlyActive = false) {
  const [credentialSchemas, setCredentialSchemas] = useState<CredentialSchemaListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errorCredentialSchemas, setError] = useState<string | null>(null)

  const fetchCredentialSchemas = useCallback(async () => {
    if ((!all && !ecosystemId) || !VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA) {
      setError(
        resolveTranslatable({ key: 'error.fetch.cs' }, translate) ??
          'Missing ecosystem ID or credential schema endpoint'
      )
      setLoading(false)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ response_max_size: '1024' })
      if (!all && ecosystemId) params.set('ecosystem_id', ecosystemId)
      if (onlyActive) params.set('archived', 'false')
      const response = await fetch(`${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/list?${params.toString()}`)
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      setCredentialSchemas(parseCredentialSchemasResponse(json))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [all, ecosystemId, onlyActive])

  useEffect(() => {
    void fetchCredentialSchemas()
  }, [fetchCredentialSchemas])

  return {
    credentialSchemas,
    loading,
    errorCredentialSchemas,
    refetch: fetchCredentialSchemas,
  }
}
