import { describe, expect, it } from 'vitest'
import { parseIndexerBlockEvent } from '@/lib/indexer-event'

describe('parseIndexerBlockEvent', () => {
  it.each(['ready', 'block'])('accepts live %s messages', (type) => {
    expect(
      parseIndexerBlockEvent({
        type,
        block: 10_928,
        blockTime: '2026-07-18T07:00:00Z',
        events: [],
      })
    ).toEqual({ height: 10_928, timestamp: '2026-07-18T07:00:00Z' })
  })

  it('ignores legacy and malformed messages', () => {
    expect(parseIndexerBlockEvent({ type: 'block-indexed', height: 10_928 })).toBeNull()
    expect(parseIndexerBlockEvent({ type: 'block', block: '10928' })).toBeNull()
  })
})
