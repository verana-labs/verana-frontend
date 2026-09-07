import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA: 'https://indexer.example/v4/credential-schema',
}))

import { logger } from '@/lib/logger'
import { fetchCredentialSchemaJson, jsonSchemaUrl, parseJsonSchema } from './useCredentialSchemaJson'

const SCHEMA = {
  $id: 'vpr:verana:vna-devnet-1:cs:26',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Keplr Fee Credential',
  type: 'object',
  properties: { memberId: { type: 'string' } },
  required: ['memberId'],
}

describe('jsonSchemaUrl', () => {
  it('targets the canonical js route', () => {
    expect(jsonSchemaUrl('26')).toBe('https://indexer.example/v4/credential-schema/js/26')
  })
})

describe('parseJsonSchema', () => {
  it('accepts a schema object and rejects anything else', () => {
    expect(parseJsonSchema(SCHEMA)).toEqual(SCHEMA)
    expect(() => parseJsonSchema('{}')).toThrow('Invalid JSON schema response')
    expect(() => parseJsonSchema([SCHEMA])).toThrow('Invalid JSON schema response')
  })
})

describe('fetchCredentialSchemaJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the canonical document', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => SCHEMA }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchCredentialSchemaJson('26')).resolves.toEqual(SCHEMA)
    expect(fetchMock).toHaveBeenCalledWith('https://indexer.example/v4/credential-schema/js/26')
  })

  it('degrades a failed request to null and logs it', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    )
    await expect(fetchCredentialSchemaJson('26')).resolves.toBeNull()
    expect(error).toHaveBeenCalledOnce()
  })
})
