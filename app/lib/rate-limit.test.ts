import { describe, expect, it } from 'vitest'
import { clientKey, createRateLimiter } from '@/lib/rate-limit'

describe('createRateLimiter', () => {
  it('allows the limit per window and key, then refuses until the window rolls', () => {
    let at = 1_000
    const limiter = createRateLimiter(3, 60_000, () => at)
    expect([limiter.allow('a'), limiter.allow('a'), limiter.allow('a')]).toEqual([true, true, true])
    expect(limiter.allow('a')).toBe(false)
    expect(limiter.allow('b')).toBe(true)
    at += 59_999
    expect(limiter.allow('a')).toBe(false)
    at += 1
    expect(limiter.allow('a')).toBe(true)
  })
})

describe('clientKey', () => {
  it('keys on the proxy-appended forwarded address, then the remote address header, then unknown', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '203.0.113.9', 'x-real-ip': '10.0.0.2' }))).toBe('203.0.113.9')
    expect(clientKey(new Headers({ 'x-forwarded-for': ' 1.2.3.4 ,203.0.113.9 , ' }))).toBe('203.0.113.9')
    expect(clientKey(new Headers({ 'x-real-ip': ' 10.0.0.2 ' }))).toBe('10.0.0.2')
    expect(clientKey(new Headers({ 'x-forwarded-for': ' , ' }))).toBe('unknown')
    expect(clientKey(new Headers())).toBe('unknown')
  })

  it('ignores client-supplied leftmost entries so a spoofed header shares one budget', () => {
    const limiter = createRateLimiter(2, 60_000, () => 0)
    const spoofed = (fake: string) => clientKey(new Headers({ 'x-forwarded-for': `${fake}, 198.51.100.7` }))
    expect(limiter.allow(spoofed('10.0.0.1'))).toBe(true)
    expect(limiter.allow(spoofed('10.0.0.2'))).toBe(true)
    expect(limiter.allow(spoofed('10.0.0.3'))).toBe(false)
    expect(spoofed('anything')).toBe('198.51.100.7')
  })
})
