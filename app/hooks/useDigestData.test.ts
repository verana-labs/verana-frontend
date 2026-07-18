import { describe, expect, it } from 'vitest'
import { parseDigestResponse } from './useDigestData'

describe('parseDigestResponse', () => {
  it('parses the strict V4 digest envelope', () => {
    expect(
      parseDigestResponse({
        digest: {
          digest: 'sha384-MzNNbQTWCSUSi0bbz7dbua+RcENv7C6FvlmYJ1Y+I727HsPOHdzwELMYO9Mz68M26',
          created: '2026-07-18T12:00:00Z',
        },
      })
    ).toEqual({
      digest: 'sha384-MzNNbQTWCSUSi0bbz7dbua+RcENv7C6FvlmYJ1Y+I727HsPOHdzwELMYO9Mz68M26',
      created: '2026-07-18T12:00:00Z',
    })
  })

  it('rejects legacy flat responses', () => {
    expect(() => parseDigestResponse({ digest: 'sha384-value', created: '2026-07-18T12:00:00Z' })).toThrow(
      'digest envelope'
    )
  })
})
