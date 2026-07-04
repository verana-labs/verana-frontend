import { faCertificate, faCircleExclamation, faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import { describe, expect, it } from 'vitest'
import { trustStateBadge } from '@/lib/trust-state'

describe('trustStateBadge', () => {
  it('maps TRUSTED to a green certificate badge', () => {
    const badge = trustStateBadge('TRUSTED')
    expect(badge.label).toBe('Trusted')
    expect(badge.icon).toBe(faCertificate)
    expect(badge.iconColorClass).toBe('text-green-500')
  })

  it('maps UNTRUSTED to a red exclamation badge', () => {
    const badge = trustStateBadge('UNTRUSTED')
    expect(badge.label).toBe('Untrusted')
    expect(badge.icon).toBe(faCircleExclamation)
    expect(badge.iconColorClass).toBe('text-red-500')
  })

  it('maps UNRESOLVED to a gray question badge', () => {
    const badge = trustStateBadge('UNRESOLVED')
    expect(badge.label).toBe('Unresolved')
    expect(badge.icon).toBe(faCircleQuestion)
    expect(badge.iconColorClass).toBe('text-gray-400 dark:text-gray-500')
  })

  it('treats undefined as unresolved', () => {
    expect(trustStateBadge(undefined)).toEqual(trustStateBadge('UNRESOLVED'))
  })

  it('treats null as unresolved', () => {
    expect(trustStateBadge(null)).toEqual(trustStateBadge('UNRESOLVED'))
  })

  it('gives the three states visually distinct icons and colors', () => {
    const trusted = trustStateBadge('TRUSTED')
    const untrusted = trustStateBadge('UNTRUSTED')
    const unresolved = trustStateBadge('UNRESOLVED')

    const icons = new Set([trusted.icon, untrusted.icon, unresolved.icon])
    const colors = new Set([trusted.iconColorClass, untrusted.iconColorClass, unresolved.iconColorClass])
    expect(icons.size).toBe(3)
    expect(colors.size).toBe(3)
  })

  it('is a pure deterministic mapping across calls', () => {
    expect(trustStateBadge('TRUSTED')).toEqual(trustStateBadge('TRUSTED'))
    expect(trustStateBadge('UNTRUSTED')).toEqual(trustStateBadge('UNTRUSTED'))
  })

  it('always returns a non-empty human-readable label', () => {
    for (const state of ['TRUSTED', 'UNTRUSTED', 'UNRESOLVED', undefined, null] as const) {
      expect(trustStateBadge(state).label.trim().length).toBeGreaterThan(0)
    }
  })
})
