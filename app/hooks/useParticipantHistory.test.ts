import { describe, expect, it } from 'vitest'
import { parseParticipantHistoryResponse } from '@/hooks/useParticipantHistory'

describe('parseParticipantHistoryResponse', () => {
  it('parses the V4 activity envelope', () => {
    expect(
      parseParticipantHistoryResponse({
        entity_type: 'Participant',
        entity_id: '1',
        activity: [
          {
            id: 42,
            timestamp: '2026-07-18T06:38:18.924Z',
            block_height: 10513,
            entity_type: 'Participant',
            entity_id: '1',
            msg: 'CreateRootParticipant',
            changes: { role: 'ECOSYSTEM' },
            account: 'verana1operator',
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        id: '42',
        entity_id: '1',
        msg: 'CreateRootParticipant',
        block_height: 10513,
      }),
    ])
  })

  it('rejects legacy history envelopes', () => {
    expect(() => parseParticipantHistoryResponse({ history: [] })).toThrow('activity envelope')
  })
})
