import { describe, expect, it } from 'vitest'
import { findEventAttribute } from './txEvents'

describe('findEventAttribute', () => {
  it('reads a created resource ID from structured transaction events', () => {
    expect(
      findEventAttribute(
        [
          {
            type: 'create_ecosystem',
            attributes: [{ key: 'ecosystem_id', value: '17' }],
          },
        ],
        'create_ecosystem',
        'ecosystem_id'
      )
    ).toBe('17')
  })

  it('returns undefined when the structured event is absent', () => {
    expect(findEventAttribute([], 'create_ecosystem', 'ecosystem_id')).toBeUndefined()
  })
})
