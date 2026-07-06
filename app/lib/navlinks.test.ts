import { describe, expect, it } from 'vitest'
import { translate } from '@/i18n/dataview'
import { allowedOffline, getNavLinks } from '@/lib/navlinks'

describe('getNavLinks', () => {
  it('returns the five top-level destinations in order', () => {
    const hrefs = getNavLinks().map((link) => link.href)
    expect(hrefs).toEqual(['/dashboard', '/account', '/tr', '/discover', '/pendingtasks'])
  })

  it('gives every link a non-empty name and an icon', () => {
    for (const link of getNavLinks()) {
      expect(link.name.length).toBeGreaterThan(0)
      expect(link.icon).toBeDefined()
    }
  })

  it('resolves names from the active dictionary, not from raw keys', () => {
    const byHref = new Map(getNavLinks().map((link) => [link.href, link.name]))
    expect(byHref.get('/dashboard')).toBe(translate('dashboard.title'))
    expect(byHref.get('/account')).toBe(translate('account.title'))
    expect(byHref.get('/tr')).toBe(translate('trlist.title'))
    expect(byHref.get('/discover')).toBe(translate('discover.title'))
    expect(byHref.get('/pendingtasks')).toBe(translate('task.title'))
  })

  it('marks only dashboard and discover as available offline', () => {
    const offline = getNavLinks()
      .filter((link) => link.availableOffline === true)
      .map((link) => link.href)
    expect(offline.sort()).toEqual(['/dashboard', '/discover'])
  })

  it('leaves availableOffline unset for online-only links', () => {
    const byHref = new Map(getNavLinks().map((link) => [link.href, link]))
    expect(byHref.get('/account')?.availableOffline).toBeUndefined()
    expect(byHref.get('/tr')?.availableOffline).toBeUndefined()
    expect(byHref.get('/pendingtasks')?.availableOffline).toBeUndefined()
  })

  it('flags the featured services and gives them descriptions', () => {
    const featured = getNavLinks().filter((link) => link.featuredService === true)
    expect(featured.map((link) => link.href)).toEqual(['/tr', '/discover'])
    for (const link of featured) {
      expect(link.description).toBeTruthy()
    }
  })

  it('propagates pendingCount onto the Pending Tasks link only', () => {
    const links = getNavLinks(7)
    const pending = links.find((link) => link.href === '/pendingtasks')
    expect(pending?.count).toBe(7)
    const others = links.filter((link) => link.href !== '/pendingtasks')
    for (const link of others) {
      expect(link.count).toBeUndefined()
    }
  })

  it('passes through a zero count rather than dropping it', () => {
    const pending = getNavLinks(0).find((link) => link.href === '/pendingtasks')
    expect(pending?.count).toBe(0)
  })

  it('leaves the count undefined when no pendingCount is supplied', () => {
    const pending = getNavLinks().find((link) => link.href === '/pendingtasks')
    expect(pending?.count).toBeUndefined()
  })

  it('builds a fresh array on each call', () => {
    expect(getNavLinks()).not.toBe(getNavLinks())
  })
})

describe('allowedOffline', () => {
  it('allows the exact static offline routes', () => {
    expect(allowedOffline('/dashboard')).toBe(true)
    expect(allowedOffline('/discover')).toBe(true)
  })

  it('rejects routes that are not in the offline allow-list', () => {
    expect(allowedOffline('/account')).toBe(false)
    expect(allowedOffline('/pendingtasks')).toBe(false)
    expect(allowedOffline('/tr')).toBe(false)
  })

  it('allows a single trust-registry detail segment', () => {
    expect(allowedOffline('/tr/abc123')).toBe(true)
    expect(allowedOffline('/tr/did:example:1')).toBe(true)
  })

  it('rejects deeper trust-registry paths beyond one segment', () => {
    expect(allowedOffline('/tr/abc/extra')).toBe(false)
    expect(allowedOffline('/tr/')).toBe(false)
  })

  it('allows a credential-schema detail segment under /tr/cs', () => {
    expect(allowedOffline('/tr/cs/schema-1')).toBe(true)
  })

  it('allows bare /tr/cs because it also satisfies the single-segment /tr/:id pattern', () => {
    expect(allowedOffline('/tr/cs')).toBe(true)
  })

  it('rejects /tr/cs/ with an empty trailing segment', () => {
    expect(allowedOffline('/tr/cs/')).toBe(false)
  })

  it('allows a single participant detail segment', () => {
    expect(allowedOffline('/participants/p1')).toBe(true)
  })

  it('rejects the participants list root and nested participant paths', () => {
    expect(allowedOffline('/participants')).toBe(false)
    expect(allowedOffline('/participants/p1/credentials')).toBe(false)
  })

  it('anchors the patterns so partial prefixes do not match', () => {
    expect(allowedOffline('/dashboard/settings')).toBe(false)
    expect(allowedOffline('/x/tr/abc')).toBe(false)
    expect(allowedOffline('tr/abc')).toBe(false)
  })

  it('treats a trailing slash on a static route as a different path', () => {
    expect(allowedOffline('/dashboard/')).toBe(false)
    expect(allowedOffline('/discover/')).toBe(false)
  })

  it('matches against the raw pathname, so a query string fails a static route', () => {
    expect(allowedOffline('/dashboard?foo=bar')).toBe(false)
  })

  it('does not strip query strings, so a suffix on a single-segment route still slips through', () => {
    expect(allowedOffline('/tr/abc?tab=1')).toBe(true)
  })

  it('rejects the empty path', () => {
    expect(allowedOffline('')).toBe(false)
  })
})
