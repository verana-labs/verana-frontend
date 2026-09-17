import { afterEach, describe, expect, it, vi } from 'vitest'

const runtimeEnv = vi.hoisted(
  () =>
    new Map<string, string>([
      ['NEXT_PUBLIC_VERANA_INDEXER_BASE_URL', 'https://idx.example/'],
      ['NEXT_PUBLIC_VERANA_FAUCET_URL', 'https://faucet.example/'],
      ['NEXT_PUBLIC_SHOW_PARTICIPANT_EXPIRE_BEFORE_DAYS', '7'],
    ])
)

vi.mock('next-runtime-env', () => ({
  env: (key: string) => runtimeEnv.get(key),
}))

process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT_STATS = 'https://legacy.example/verana/stats/v1'
process.env.NEXT_PUBLIC_VERANA_WEBSOCKET = 'wss://legacy.example/verana/indexer/v1/events'

import {
  VERANA_FAUCET_URL,
  VERANA_REST_ENDPOINT_STATS,
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
  VERANA_WEBSOCKET,
} from '@/config/env'
import { isExpireSoon } from '@/util/util'

describe('indexer endpoints', () => {
  it('derives every route from the indexer base url and ignores legacy per-module variables', () => {
    expect(VERANA_REST_ENDPOINT_STATS).toBe('https://idx.example/v4/stats')
    expect(VERANA_REST_ENDPOINT_TRUST_DEPOSIT).toBe('https://idx.example/v4/trust-deposit')
    expect(VERANA_WEBSOCKET).toBe('wss://idx.example/v4/indexer/subscribe')
  })
})

describe('participant expires-soon window', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('flags an effective_until inside the configured number of days only', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 14, 0, 0))
    expect(isExpireSoon(new Date(2026, 5, 29))).toBe(true)
    expect(isExpireSoon(new Date(2026, 6, 10))).toBe(false)
    expect(isExpireSoon('2026-07-10T09:30:00.000Z')).toBe(true)
    expect(isExpireSoon('2026-09-10T09:30:00.000Z')).toBe(false)
  })
})

describe('faucet url', () => {
  it('strips the trailing slash', () => {
    expect(VERANA_FAUCET_URL).toBe('https://faucet.example')
  })

  it('stays undefined when the variable is unset', async () => {
    runtimeEnv.delete('NEXT_PUBLIC_VERANA_FAUCET_URL')
    delete process.env.NEXT_PUBLIC_VERANA_FAUCET_URL
    vi.resetModules()
    const env = await import('@/config/env')
    expect(env.VERANA_FAUCET_URL).toBeUndefined()
  })
})
