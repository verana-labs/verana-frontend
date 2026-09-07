'use client'

import { useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA } from '@/config/env'
import { logger } from '@/lib/logger'

export type JsonSchemaDocument = Record<string, unknown>

export function jsonSchemaUrl(id: string): string | undefined {
  return VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA ? `${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/js/${id}` : undefined
}

export function parseJsonSchema(payload: unknown): JsonSchemaDocument {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid JSON schema response')
  }
  return payload as JsonSchemaDocument
}

export async function fetchCredentialSchemaJson(id: string): Promise<JsonSchemaDocument | null> {
  const url = jsonSchemaUrl(id)
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Unable to fetch the JSON schema: ${response.status}`)
    return parseJsonSchema(await response.json())
  } catch (cause) {
    logger.error(`credential schema ${id} json schema`, cause)
    return null
  }
}

export function useCredentialSchemaJson(id: string): JsonSchemaDocument | null {
  const [jsonSchema, setJsonSchema] = useState<JsonSchemaDocument | null>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestRef.current
    if (!id) {
      setJsonSchema(null)
      return
    }
    void fetchCredentialSchemaJson(id).then((schema) => {
      if (requestRef.current === requestId) setJsonSchema(schema)
    })
  }, [id])

  return jsonSchema
}
