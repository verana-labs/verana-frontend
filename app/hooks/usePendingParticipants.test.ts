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

  it('maps the identity claims of a full trust_data payload', () => {
    const row = parsePendingParticipantsResponse({
      ecosystems: [
        {
          id: 10,
          did: 'did:web:ecosystem.example',
          trust_data: {
            did: 'did:web:ecosystem.example',
            trusted: true,
            expiresAtTime: null,
            ecsCredentials: [
              { ecsSchema: 'ServiceCredential', credentialSubject: { name: 'Acme Ecosystem' } },
              { ecsSchema: 'OrganizationCredential', credentialSubject: { countryCode: 'CH' } },
            ],
          },
          pending_tasks: 1,
          participants: 4,
          schemas: [{ id: 9, title: 'T', description: null, pending_tasks: 1, pending_participants: [] }],
        },
      ],
    })[0]
    expect(row.trustData?.trustStatus).toBe('TRUSTED')
    expect(row.trustData?.serviceName).toBe('Acme Ecosystem')
    expect(row.trustData?.countryCode).toBe('CH')
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
