import { describe, expect, it } from 'vitest'
import { parseGraphVersionResponse } from './useGraphVersion'

describe('parseGraphVersionResponse', () => {
  it('reads the version of the OpenAPI document', () => {
    expect(parseGraphVersionResponse({ openapi: '3.0.3', info: { title: 'Verana Graph API', version: '1.0.0' } })).toBe(
      'v1.0.0'
    )
  })

  it('keeps a version that already carries the prefix', () => {
    expect(parseGraphVersionResponse({ info: { version: 'v0.1.0' } })).toBe('v0.1.0')
  })

  it('rejects a document without info.version', () => {
    expect(() => parseGraphVersionResponse({ info: {} })).toThrow('Invalid graph version response: info.version')
  })
})
