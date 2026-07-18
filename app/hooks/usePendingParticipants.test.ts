import { describe, expect, it } from 'vitest'
import { parsePendingParticipantsResponse } from './usePendingParticipants'

describe('parsePendingParticipantsResponse', () => {
  it('parses nested V4 pending participants', () => {
    expect(
      parsePendingParticipantsResponse({
        ecosystems: [
          {
            id: 10,
            did: 'did:web:ecosystem.example',
            pending_tasks: 1,
            participants: 4,
            schemas: [
              {
                id: 9,
                title: 'OrganizationCredential',
                description: null,
                pending_tasks: 1,
                pending_participants: [],
              },
            ],
          },
        ],
      })
    ).toEqual([
      {
        id: '10',
        did: 'did:web:ecosystem.example',
        pending_tasks: 1,
        participants: 4,
        schemas: [
          {
            id: '9',
            title: 'OrganizationCredential',
            description: null,
            pending_tasks: 1,
            pending_participants: [],
          },
        ],
      },
    ])
  })

  it('rejects a schema without pending participants', () => {
    expect(() =>
      parsePendingParticipantsResponse({
        ecosystems: [{ id: 10, did: null, pending_tasks: 0, participants: 0, schemas: [{ id: 9 }] }],
      })
    ).toThrow('ecosystems[0].schemas[0].pending_participants')
  })
})
