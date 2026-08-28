import { describe, expect, it } from 'vitest'
import { parseIndexerVersionResponse } from './useIndexerVersion'

describe('parseIndexerVersionResponse', () => {
  it('reads the V4 snake-case version envelope', () => {
    expect(parseIndexerVersionResponse({ app_version: 'v2.0.0-dev.53' })).toBe('v2.0.0-dev.53')
  })

  it('rejects the obsolete camel-case shape', () => {
    expect(() => parseIndexerVersionResponse({ appVersion: 'v2.0.0-dev.53' })).toThrow(
      'Invalid indexer version response: app_version'
    )
  })
})
