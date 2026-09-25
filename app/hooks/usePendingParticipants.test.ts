import { describe, expect, it } from 'vitest'
import { parsePendingParticipantsResponse, pendingParticipantsUrl } from './usePendingParticipants'

describe('pendingParticipantsUrl', () => {
  it('queries by corporation id', () => {
    expect(pendingParticipantsUrl('https://indexer/v4/participant', 1)).toBe(
      'https://indexer/v4/participant/pending/flat?corporation_id=1&trust_data=summary&limit=1024'
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

  it('reads the summary trust_data: a trust state, and no name for the page to show', () => {
    const row = parsePendingParticipantsResponse({
      ecosystems: [
        {
          id: 10,
          did: 'did:web:ecosystem.example',
          trust_data: { did: 'did:web:ecosystem.example', trusted: true, expiresAtTime: null },
          pending_tasks: 1,
          participants: 4,
          schemas: [{ id: 9, title: 'T', description: null, pending_tasks: 1, pending_participants: [] }],
        },
      ],
    })[0]
    expect(row.trustData?.trustStatus).toBe('TRUSTED')
    expect(row.trustData?.serviceName).toBeUndefined()
  })

  it('leaves the enrichment unset for an ecosystem with no DID', () => {
    const row = parsePendingParticipantsResponse({
      ecosystems: [{ id: 10, did: null, trust_data: null, pending_tasks: 0, participants: 0, schemas: [] }],
    })[0]
    expect(row.trustData).toBeUndefined()
  })

  it('rejects a schema without pending participants', () => {
    expect(() =>
      parsePendingParticipantsResponse({
        ecosystems: [{ id: 10, did: null, pending_tasks: 0, participants: 0, schemas: [{ id: 9 }] }],
      })
    ).toThrow('ecosystems[0].schemas[0].pending_participants')
  })
})
