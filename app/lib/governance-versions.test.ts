import { describe, expect, it } from 'vitest'
import { governanceVersionTargets } from '@/lib/governance-versions'

describe('governanceVersionTargets', () => {
  it('offers the next version only when nothing is drafted', () => {
    expect(governanceVersionTargets([{ version: 1 }], 1)).toEqual({ drafts: [], next: 2, activatable: null })
    expect(governanceVersionTargets([], 0)).toEqual({ drafts: [], next: 1, activatable: null })
  })

  it('lists drafts above the active version, sorted, plus the next new version', () => {
    expect(governanceVersionTargets([{ version: 3 }, { version: 1 }, { version: 2 }], 1)).toEqual({
      drafts: [2, 3],
      next: 4,
      activatable: 2,
    })
  })

  it('never offers the active version or older ones', () => {
    expect(governanceVersionTargets([{ version: 1 }, { version: 2 }], 2)).toEqual({
      drafts: [],
      next: 3,
      activatable: null,
    })
  })
})
