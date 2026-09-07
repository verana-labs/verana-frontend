import { describe, expect, it } from 'vitest'
import { parseIndexerBlockEvent, parseIndexerBlockHeight } from '@/lib/indexer-event'

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

describe('parseIndexerBlockHeight', () => {
  it('accepts the live block-height response', () => {
    expect(
      parseIndexerBlockHeight({ type: 'block-indexed', height: 506_370, timestamp: '2026-09-07T17:28:06Z' })
    ).toEqual({ height: 506_370, timestamp: '2026-09-07T17:28:06Z' })
  })

  it('rejects malformed responses', () => {
    expect(parseIndexerBlockHeight({ height: '506370' })).toBeNull()
    expect(parseIndexerBlockHeight({ height: 1, timestamp: 5 })).toBeNull()
    expect(parseIndexerBlockHeight(null)).toBeNull()
  })
})
