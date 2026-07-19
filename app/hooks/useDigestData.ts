'use client'

import { useCallback, useState } from 'react'
import { VERANA_REST_ENDPOINT_DIGEST } from '@/config/env'

export interface DigestData {
  digest: string
  created: string
}

export type DigestLookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid digest response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid digest response: ${path}`)
  return value
}

export function parseDigestResponse(payload: unknown): DigestData {
  const envelope = record(payload, 'response')
  if (!('digest' in envelope) || typeof envelope.digest !== 'object') {
    throw new Error('Invalid digest response: missing digest envelope')
  }
  const digest = record(envelope.digest, 'digest')
  return {
    digest: string(digest.digest, 'digest.digest'),
    created: string(digest.created, 'digest.created'),
  }
}

export function useDigestData() {
  const [digestData, setDigestData] = useState<DigestData | null>(null)
  const [status, setStatus] = useState<DigestLookupStatus>('idle')
  const [errorDigest, setErrorDigest] = useState<string | null>(null)

  const lookup = useCallback(async (digest: string) => {
    if (!digest || !VERANA_REST_ENDPOINT_DIGEST) {
      setDigestData(null)
      setStatus('error')
      setErrorDigest('Missing digest or V4 digest endpoint')
      return
    }

    setDigestData(null)
    setStatus('loading')
    setErrorDigest(null)
    try {
      const response = await fetch(`${VERANA_REST_ENDPOINT_DIGEST}/get/${encodeURIComponent(digest)}`)
      if (response.status === 404) {
        setStatus('not-found')
        return
      }
      const payload: unknown = await response.json()
      if (!response.ok) throw new Error(`Unable to look up digest: ${response.status}`)
      setDigestData(parseDigestResponse(payload))
      setStatus('found')
    } catch (error) {
      setStatus('error')
      setErrorDigest(error instanceof Error ? error.message : String(error))
    }
  }, [])

  return { digestData, status, errorDigest, lookup }
}
