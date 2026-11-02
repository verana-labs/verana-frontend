'use client'

import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA } from '@/config/env'
import { fetchJson, indexerValidators } from '@/lib/indexer-json'
import { logger } from '@/lib/logger'

const { record } = indexerValidators('json schema')

interface CanonicalJsonSchema {
  schema: Record<string, unknown> | null
  failed: boolean
}

export function useCanonicalJsonSchema(id: string): CanonicalJsonSchema {
  const [state, setState] = useState<CanonicalJsonSchema>({ schema: null, failed: false })

  useEffect(() => {
    setState({ schema: null, failed: false })
    if (!id) return
    if (!VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA) {
      setState({ schema: null, failed: true })
      return
    }
    let active = true
    fetchJson(`${VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA}/js/${id}`, 'Unable to fetch the JSON Schema')
      .then((payload) => {
        if (active) setState({ schema: record(payload, 'json schema'), failed: false })
      })
      .catch((cause) => {
        logger.error('canonical json schema', cause)
        if (active) setState({ schema: null, failed: true })
      })
    return () => {
      active = false
    }
  }, [id])

  return state
}
