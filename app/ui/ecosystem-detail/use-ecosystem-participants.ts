'use client'

import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_PARTICIPANT } from '@/config/env'
import { parseParticipantsResponse, participantsListUrl } from '@/hooks/useParticipants'
import { fetchJson, takeKeysetPage } from '@/lib/indexer-json'
import type { Participant } from '@/ui/dataview/datasections/participant'

export const ECOSYSTEM_PARTICIPANTS_PER_SCHEMA = 200

const MAX_PARALLEL_REQUESTS = 4

async function mapInBatches<T, R>(items: T[], size: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  for (let start = 0; start < items.length; start += size) {
    results.push(...(await Promise.all(items.slice(start, start + size).map(run))))
  }
  return results
}

type State = { key: string; participants: Participant[]; partial: boolean; error: string | null }

export function useEcosystemParticipants(schemaIds: string[], enabled: boolean) {
  const key = schemaIds.join('|')
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    const base = VERANA_REST_ENDPOINT_PARTICIPANT
    if (!enabled || !base) return
    let cancelled = false
    const ids = key ? key.split('|') : []
    const requestKey = `${key}#${nonce}`
    mapInBatches(ids, MAX_PARALLEL_REQUESTS, async (schema) => {
      const url = participantsListUrl(base, {
        schema,
        trustData: 'full',
        pageSize: ECOSYSTEM_PARTICIPANTS_PER_SCHEMA,
      })
      const payload = await fetchJson(url, 'Unable to fetch participants')
      return takeKeysetPage(parseParticipantsResponse(payload), ECOSYSTEM_PARTICIPANTS_PER_SCHEMA)
    })
      .then((pages) => {
        if (cancelled) return
        setState({
          key: requestKey,
          participants: pages.flatMap((page) => page.items),
          partial: pages.some((page) => page.hasNext),
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          key: requestKey,
          participants: [],
          partial: false,
          error: error instanceof Error ? error.message : String(error),
        })
      })
    return () => {
      cancelled = true
    }
  }, [enabled, key, nonce])

  const refetch = useCallback(() => setNonce((value) => value + 1), [])

  if (!VERANA_REST_ENDPOINT_PARTICIPANT) {
    return { participants: null, partial: false, error: 'Participants endpoint is not configured', refetch }
  }

  const current = state?.key === `${key}#${nonce}` ? state : null

  return {
    participants: current && !current.error ? current.participants : null,
    partial: current?.partial ?? false,
    error: current?.error ?? null,
    refetch,
  }
}
