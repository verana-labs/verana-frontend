import { describe, expect, it } from 'vitest'
import { parsePendingParticipantsResponse, pendingParticipantsUrl } from './usePendingParticipants'

describe('pendingParticipantsUrl', () => {
  it('queries by corporation id with summary trust data', () => {
    expect(pendingParticipantsUrl('https://indexer/v4/participant', 1)).toBe(
      'https://indexer/v4/participant/pending/flat?corporation_id=1&limit=1024&trust_data=summary'
    )
  })
})

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
        trust: null,
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

  it('maps the summary trust data of an ecosystem group', () => {
    const [ecosystem] = parsePendingParticipantsResponse({
      ecosystems: [
        {
          id: 10,
          did: 'did:web:ecosystem.example',
          trust_data: { did: 'did:web:ecosystem.example', trusted: true, expiresAtTime: null, corporationId: 8 },
          pending_tasks: 0,
          participants: 0,
          schemas: [],
        },
      ],
    })
    expect(ecosystem.trust).toMatchObject({ did: 'did:web:ecosystem.example', trustStatus: 'TRUSTED' })
  })

  it('rejects a schema without pending participants', () => {
    expect(() =>
      parsePendingParticipantsResponse({
        ecosystems: [{ id: 10, did: null, pending_tasks: 0, participants: 0, schemas: [{ id: 9 }] }],
      })
    ).toThrow('ecosystems[0].schemas[0].pending_participants')
  })
})
