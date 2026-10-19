import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AGENTS_PAGE_SIZE, agentEcosystemsUrl, agentParticipantsUrl } from '@/hooks/useAgents'
import { ecosystemSchemasUrl } from '@/hooks/useCredentialSchemas'
import { participantsListUrl } from '@/hooks/useParticipants'
import { pendingParticipantsUrl } from '@/hooks/usePendingParticipants'
import { logger } from '@/lib/logger'
import { applyKeysetParams, fetchKeysetPages, indexerValidators, takeKeysetPage } from './indexer-json'

const {
  record,
  string,
  number,
  integer,
  scaledShare,
  decimalAmount,
  nullableString,
  nullableTimestamp,
  optionalString,
  stringArray,
} = indexerValidators('sample')

const rejected = (path: string) => `Invalid sample response: ${path}`

describe('indexerValidators', () => {
  it('record accepts plain objects and rejects null and arrays', () => {
    expect(record({ id: 1 }, 'response')).toEqual({ id: 1 })
    expect(() => record(null, 'response')).toThrow(rejected('response'))
    expect(() => record([], 'response')).toThrow(rejected('response'))
  })

  it('string accepts strings only', () => {
    expect(string('did:web:example.com', 'schema.did')).toBe('did:web:example.com')
    expect(() => string(undefined, 'schema.did')).toThrow(rejected('schema.did'))
  })

  it('number accepts any finite number and rejects NaN and numeric strings', () => {
    expect(number(-1.5, 'schema.id')).toBe(-1.5)
    expect(() => number(Number.NaN, 'schema.id')).toThrow(rejected('schema.id'))
    expect(() => number('1', 'schema.id')).toThrow(rejected('schema.id'))
  })

  it('integer accepts non-negative safe integers only', () => {
    expect(integer(0, 'deposit')).toBe(0)
    expect(() => integer(-1, 'deposit')).toThrow(rejected('deposit'))
    expect(() => integer(1.5, 'deposit')).toThrow(rejected('deposit'))
    expect(() => integer(Number.MAX_SAFE_INTEGER + 1, 'deposit')).toThrow(rejected('deposit'))
  })

  it('scaledShare accepts integers above MAX_SAFE_INTEGER but not fractions or negatives', () => {
    expect(scaledShare(Number.MAX_SAFE_INTEGER + 1, 'share')).toBe(Number.MAX_SAFE_INTEGER + 1)
    expect(() => scaledShare(0.5, 'share')).toThrow(rejected('share'))
    expect(() => scaledShare(-1, 'share')).toThrow(rejected('share'))
  })

  it('decimalAmount stringifies safe integers and accepts canonical numeric strings', () => {
    expect(decimalAmount(42, 'weight')).toBe('42')
    expect(decimalAmount('0', 'weight')).toBe('0')
    expect(decimalAmount('1230', 'weight')).toBe('1230')
    expect(() => decimalAmount('4.0', 'weight')).toThrow(rejected('weight'))
    expect(() => decimalAmount('007', 'weight')).toThrow(rejected('weight'))
    expect(() => decimalAmount(-1, 'weight')).toThrow(rejected('weight'))
  })

  it('nullableString passes null through and rejects undefined', () => {
    expect(nullableString(null, 'archived')).toBeNull()
    expect(nullableString('2026-01-01', 'archived')).toBe('2026-01-01')
    expect(() => nullableString(undefined, 'archived')).toThrow(rejected('archived'))
  })

  it('nullableTimestamp passes null through and rejects numbers', () => {
    expect(nullableTimestamp(null, 'last_slashed')).toBeNull()
    expect(nullableTimestamp('2026-01-01T00:00:00Z', 'last_slashed')).toBe('2026-01-01T00:00:00Z')
    expect(() => nullableTimestamp(1_700_000_000, 'last_slashed')).toThrow(rejected('last_slashed'))
  })

  it('optionalString passes undefined through and rejects null', () => {
    expect(optionalString(undefined, 'created')).toBeUndefined()
    expect(optionalString('2026-01-01', 'created')).toBe('2026-01-01')
    expect(() => optionalString(null, 'created')).toThrow(rejected('created'))
  })

  it('stringArray accepts empty and all-string arrays and rejects anything else', () => {
    expect(stringArray([], 'msg_types')).toEqual([])
    expect(stringArray(['a', 'b'], 'msg_types')).toEqual(['a', 'b'])
    expect(() => stringArray(['a', 1], 'msg_types')).toThrow(rejected('msg_types'))
    expect(() => stringArray('a', 'msg_types')).toThrow(rejected('msg_types'))
  })
})

describe('applyKeysetParams', () => {
  it('asks for one row more than the page and sorts newest-first by default', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 9 })
    expect(params.toString()).toBe('limit=10&sort=-id')
  })

  it('keeps the parameters the caller already set', () => {
    const params = new URLSearchParams({ trust_data: 'full', archived: 'false' })
    applyKeysetParams(params, { pageSize: 5 })
    expect(params.get('trust_data')).toBe('full')
    expect(params.get('archived')).toBe('false')
    expect(params.get('limit')).toBe('6')
  })

  it('passes the last id verbatim as the descending cursor, because max_id excludes it', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 9, after: '24' })
    expect(params.get('max_id')).toBe('24')
    expect(params.get('min_id')).toBeNull()
  })

  it('advances the last id by one as the ascending cursor, because min_id includes it', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 25, after: '20', sort: '+id' })
    expect(params.get('min_id')).toBe('21')
    expect(params.get('max_id')).toBeNull()
    expect(params.get('sort')).toBe('+id')
  })

  it('advances an id above the safe integer range without losing precision', () => {
    const params = new URLSearchParams()
    applyKeysetParams(params, { pageSize: 25, after: '9007199254740993', sort: '+id' })
    expect(params.get('min_id')).toBe('9007199254740994')
  })
})

describe('takeKeysetPage', () => {
  it('reports a next page and drops the extra row', () => {
    expect(takeKeysetPage([1, 2, 3, 4], 3)).toEqual({ items: [1, 2, 3], hasNext: true })
  })

  it('reports no next page when the window holds the page exactly', () => {
    expect(takeKeysetPage([1, 2, 3], 3)).toEqual({ items: [1, 2, 3], hasNext: false })
  })

  it('reports no next page for an empty window', () => {
    expect(takeKeysetPage([], 3)).toEqual({ items: [], hasNext: false })
  })
})

describe('fetchKeysetPages', () => {
  const rows = (from: number, count: number) => Array.from({ length: count }, (_, index) => ({ id: from - index }))
  const count = (payload: Record<string, unknown[]>) => payload.items.length

  function stubPages(pages: unknown[]) {
    const fetchMock = vi.fn(async (_url: string) => ({ ok: true, json: async () => pages.shift() }))
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('asks for the widest window the indexer accepts, newest first', async () => {
    const fetchMock = stubPages([{ items: rows(3, 3) }])

    await expect(fetchKeysetPages('https://idx.example/list?owner=7', 'items', 'list', count)).resolves.toEqual({
      value: 3,
      partial: false,
    })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['https://idx.example/list?owner=7&limit=1024&sort=-id'])
  })

  it('follows the cursor past the first window until a short page', async () => {
    const fetchMock = stubPages([{ items: rows(5000, 1024) }, { items: rows(3977, 10) }])

    await expect(fetchKeysetPages('https://idx.example/list', 'items', 'list', count)).resolves.toEqual({
      value: 1033,
      partial: false,
    })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://idx.example/list?limit=1024&sort=-id',
      'https://idx.example/list?limit=1024&sort=-id&max_id=3978',
    ])
  })

  it('stops at the page bound and reports the rows as partial', async () => {
    const fetchMock = stubPages([{ items: rows(5000, 1024) }, { items: rows(3977, 1024) }])

    await expect(
      fetchKeysetPages('https://idx.example/list', 'items', 'list', count, { maxPages: 2 })
    ).resolves.toEqual({
      value: 2046,
      partial: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the rows already read when a later page fails', async () => {
    const pages: unknown[] = [{ items: rows(5000, 1024) }]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const page = pages.shift()
        return page ? { ok: true, json: async () => page } : { ok: false, status: 502, json: async () => ({}) }
      })
    )

    await expect(fetchKeysetPages('https://idx.example/list', 'items', 'list', count)).resolves.toEqual({
      value: 1023,
      partial: true,
    })
  })

  it('still fails when the first page fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }))
    )

    await expect(fetchKeysetPages('https://idx.example/list', 'items', 'list', count)).rejects.toThrow('list: 502')
  })

  it('stops instead of counting a page that does not move past the cursor', async () => {
    const fetchMock = stubPages([{ items: rows(5000, 1024) }, { items: rows(5000, 1024) }])

    await expect(fetchKeysetPages('https://idx.example/list', 'items', 'list', count)).resolves.toEqual({
      value: 1023,
      partial: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects a page without its envelope', async () => {
    stubPages([{}])

    await expect(fetchKeysetPages('https://idx.example/list', 'items', 'list', count)).rejects.toThrow('items')
  })
})

describe('the list URLs of the indexer', () => {
  const PARTICIPANT = 'https://indexer/v4/participant'
  const SCHEMA = 'https://indexer/v4/credential-schema'
  const ECOSYSTEM = 'https://indexer/v4/ecosystem'

  it.each([
    [
      'the participants of a schema role, with the claims their cards render',
      participantsListUrl(PARTICIPANT, {
        schema: '9',
        role: 'ISSUER_GRANTOR',
        participantState: 'ACTIVE',
        trustData: 'full',
        pageSize: 25,
      }),
      `${PARTICIPANT}/list?schema_id=9&trust_data=full&limit=26&sort=%2Bid&role=ISSUER_GRANTOR&participant_state=ACTIVE`,
    ],
    [
      'the next ascending page of the same set, filters kept',
      participantsListUrl(PARTICIPANT, {
        schema: '9',
        role: 'ISSUER_GRANTOR',
        participantState: 'ACTIVE',
        trustData: 'full',
        pageSize: 25,
        after: '40',
      }),
      `${PARTICIPANT}/list?schema_id=9&trust_data=full&limit=26&sort=%2Bid&min_id=41&role=ISSUER_GRANTOR&participant_state=ACTIVE`,
    ],
    [
      'a tree node that shows every participant state',
      participantsListUrl(PARTICIPANT, { schema: '9', role: 'ECOSYSTEM', trustData: 'full', pageSize: 25 }),
      `${PARTICIPANT}/list?schema_id=9&trust_data=full&limit=26&sort=%2Bid&role=ECOSYSTEM`,
    ],
    [
      'the agent participants of a Corporation, ACTIVE only',
      agentParticipantsUrl(PARTICIPANT, 13, false, AGENTS_PAGE_SIZE),
      `${PARTICIPANT}/list?corporation_id=13&limit=26&sort=-id&participant_state=ACTIVE`,
    ],
    [
      'the agent participants with the inactive entries included',
      agentParticipantsUrl(PARTICIPANT, 13, true, AGENTS_PAGE_SIZE),
      `${PARTICIPANT}/list?corporation_id=13&limit=26&sort=-id`,
    ],
    [
      'the next descending page of the controlled Ecosystems',
      agentEcosystemsUrl(ECOSYSTEM, 13, AGENTS_PAGE_SIZE, '40'),
      `${ECOSYSTEM}/list?corporation_id=13&limit=26&sort=-id&max_id=40`,
    ],
    [
      'the non-archived schemas of one ecosystem',
      ecosystemSchemasUrl(SCHEMA, '7', 12),
      `${SCHEMA}/list?ecosystem_id=7&archived=false&limit=13&sort=-id`,
    ],
    [
      'the next page of the schemas of that ecosystem',
      ecosystemSchemasUrl(SCHEMA, '7', 12, '30'),
      `${SCHEMA}/list?ecosystem_id=7&archived=false&limit=13&sort=-id&max_id=30`,
    ],
    [
      'the pending tasks of a Corporation, on an endpoint with no cursor',
      pendingParticipantsUrl(PARTICIPANT, 1),
      `${PARTICIPANT}/pending/flat?corporation_id=1&trust_data=summary&limit=1024`,
    ],
  ])('asks for %s', (_case, url, expected) => {
    expect(url).toBe(expected)
  })
})
