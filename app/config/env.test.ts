import { describe, expect, it, vi } from 'vitest'

vi.mock('next-runtime-env', () => ({
  env: (key: string) => (key === 'NEXT_PUBLIC_VERANA_INDEXER_BASE_URL' ? 'https://idx.example/' : undefined),
}))

process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_STATS = 'https://legacy.example/verana/stats/v1'
process.env.NEXT_PUBLIC_VERANA_WEBSOCKET = 'wss://legacy.example/verana/indexer/v1/events'

import { VERANA_REST_ENDPOINT_STATS, VERANA_REST_ENDPOINT_TRUST_DEPOSIT, VERANA_WEBSOCKET } from '@/config/env'

describe('indexer endpoints', () => {
  it('derives every route from the indexer base url and ignores legacy per-module variables', () => {
    expect(VERANA_REST_ENDPOINT_STATS).toBe('https://idx.example/v4/stats')
    expect(VERANA_REST_ENDPOINT_TRUST_DEPOSIT).toBe('https://idx.example/v4/trust-deposit')
    expect(VERANA_WEBSOCKET).toBe('wss://idx.example/v4/indexer/subscribe')
  })
})
