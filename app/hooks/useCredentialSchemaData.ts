'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'
import type { CredentialSchemaData } from '@/ui/dataview/datasections/cs'
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

function mode(value: unknown, path: string, allowed: Set<string>): string {
  const result = string(value, path)
  if (!allowed.has(result)) throw new Error(`Invalid credential schema response: ${path}`)
  return result
}

function nullableString(value: unknown, path: string): string | null {
  if (value === null) return null
  return string(value, path)
}

export function parseCredentialSchemaResponse(payload: unknown): CredentialSchemaData {
  const envelope = record(payload, 'response')
  if (!('schema' in envelope)) {
    throw new Error('Invalid credential schema response: missing schema envelope')
  }
  const source = record(envelope.schema, 'schema')
  return {
    id: number(source.id, 'schema.id'),
    ecosystemId: number(source.ecosystem_id, 'schema.ecosystem_id'),
    jsonSchema: string(source.json_schema, 'schema.json_schema'),
    issuerGrantorValidationValidityPeriod: number(
      source.issuer_grantor_validation_validity_period,
      'schema.issuer_grantor_validation_validity_period'
    ),
    verifierGrantorValidationValidityPeriod: number(
      source.verifier_grantor_validation_validity_period,
      'schema.verifier_grantor_validation_validity_period'
    ),
    issuerValidationValidityPeriod: number(
      source.issuer_validation_validity_period,
      'schema.issuer_validation_validity_period'
    ),
    verifierValidationValidityPeriod: number(
      source.verifier_validation_validity_period,
      'schema.verifier_validation_validity_period'
    ),
    holderValidationValidityPeriod: number(
      source.holder_validation_validity_period,
      'schema.holder_validation_validity_period'
    ),
    issuerOnboardingMode: mode(source.issuer_onboarding_mode, 'schema.issuer_onboarding_mode', ONBOARDING_MODES),
    verifierOnboardingMode: mode(source.verifier_onboarding_mode, 'schema.verifier_onboarding_mode', ONBOARDING_MODES),
    holderOnboardingMode:
      source.holder_onboarding_mode === null
        ? null
        : mode(source.holder_onboarding_mode, 'schema.holder_onboarding_mode', HOLDER_ONBOARDING_MODES),
    pricingAssetType: nullableString(source.pricing_asset_type, 'schema.pricing_asset_type'),
    pricingAsset: nullableString(source.pricing_asset, 'schema.pricing_asset'),
    digestAlgorithm: nullableString(source.digest_algorithm, 'schema.digest_algorithm'),
    archived: nullableString(source.archived, 'schema.archived'),
    title: typeof source.title === 'string' ? source.title : undefined,
    description: typeof source.description === 'string' ? source.description : undefined,
    state: source.archived === null ? 'ACTIVE' : 'ARCHIVED',
  }
}

export function useCredentialSchemaData(id: string) {
  const [credentialSchema, setCredentialSchema] = useState<CredentialSchemaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorCredentialSchema, setError] = useState<string | null>(null)

  const fetchCredentialSchema = useCallback(async () => {
    if (!id || !VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA) {
      setError(resolveTranslatable({ key: 'error.fetch.cs' }, translate) ?? 'Missing credential schema ID or endpoint')
      setLoading(false)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const response = await fetch(`${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/get/${id}`)
      const json: unknown = await response.json()
      if (!response.ok) {
        const { error, code } = json as ApiErrorResponse
        throw new Error(`Error ${code}: ${error}`)
      }
      setCredentialSchema(parseCredentialSchemaResponse(json))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchCredentialSchema()
  }, [fetchCredentialSchema])

  return {
    credentialSchema,
    loading,
    errorCredentialSchema,
    refetch: fetchCredentialSchema,
  }
}
