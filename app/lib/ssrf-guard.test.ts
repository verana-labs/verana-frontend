import { beforeEach, describe, expect, it, vi } from 'vitest'

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }))

vi.mock('node:dns', () => ({ promises: { lookup } }))

import { SafeFetchError } from '@/lib/safe-fetch-error'
import { assertPublicTarget, isForbiddenHostname, isPrivateAddress } from '@/lib/ssrf-guard'

async function rejection(promise: Promise<unknown>): Promise<SafeFetchError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof SafeFetchError) return error
    throw error
  }
  throw new Error('expected a SafeFetchError')
}

describe('isPrivateAddress', () => {
  it('flags every forbidden IPv4 range and nothing else', () => {
    for (const ip of [
      '0.0.0.0',
      '0.255.255.255',
      '10.1.2.3',
      '100.64.0.1',
      '100.127.255.255',
      '127.0.0.1',
      '127.255.255.255',
      '169.254.169.254',
      '172.16.0.1',
      '172.31.255.255',
      '192.0.0.1',
      '192.168.1.1',
      '198.18.0.1',
      '198.19.255.255',
      '224.0.0.1',
      '240.0.0.1',
      '255.255.255.255',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true)
    }
    for (const ip of [
      '1.1.1.1',
      '8.8.8.8',
      '9.255.255.255',
      '100.128.0.0',
      '172.32.0.1',
      '192.0.1.1',
      '198.20.0.1',
      '203.0.113.9',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(false)
    }
  })

  it('flags the forbidden IPv6 ranges, mapped and compat IPv4 forms', () => {
    for (const ip of [
      '::',
      '::1',
      '[::1]',
      'fc00::1',
      'fd12:3456:789a::1',
      'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      'fe80::1',
      'fe80::1%eth0',
      'febf::1',
      'ff02::1',
      '::ffff:127.0.0.1',
      '::ffff:10.0.0.1',
      '::ffff:169.254.169.254',
      '::ffff:7f00:1',
      '::127.0.0.1',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true)
    }
    for (const ip of [
      '2001:db8::1',
      '2606:4700::1111',
      'fec0::1',
      'fe00::1',
      '::ffff:8.8.8.8',
      '::ffff:808:808',
      '::8.8.8.8',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(false)
    }
  })

  it('does not classify names or malformed literals as private', () => {
    for (const value of ['example.com', '', '256.1.1.1', '1.2.3', '1.2.3.4.5', ':::', '1:2:3:4:5:6:7', 'g::1']) {
      expect(isPrivateAddress(value), value).toBe(false)
    }
  })
})

describe('isForbiddenHostname', () => {
  it('rejects loopback, special-use names and private literals', () => {
    for (const host of [
      'localhost',
      'LOCALHOST',
      'localhost.',
      'foo.localhost',
      'printer.local',
      'db.internal',
      'metadata.google.internal',
      'router.home.arpa',
      'home.arpa',
      '127.0.0.1',
      '[::1]',
      '169.254.169.254',
      '10.0.0.1',
      '',
    ]) {
      expect(isForbiddenHostname(host), host).toBe(true)
    }
  })

  it('lets public names and public literals through', () => {
    for (const host of [
      'example.com',
      'localhost.example.com',
      'internal.example.com',
      'idx.devnet.verana.network',
      '8.8.8.8',
      '[2606:4700::1111]',
    ]) {
      expect(isForbiddenHostname(host), host).toBe(false)
    }
  })
})

describe('assertPublicTarget', () => {
  beforeEach(() => {
    lookup.mockReset()
  })

  it('rejects forbidden hostnames and private literals without a lookup', async () => {
    for (const url of [
      'http://localhost/x',
      'https://169.254.169.254/latest',
      'http://[::1]/',
      'http://2130706433/',
      'https://db.internal/',
    ]) {
      const error = await rejection(assertPublicTarget(url))
      expect(error.status, url).toBe(400)
    }
    expect(lookup).not.toHaveBeenCalled()
  })

  it('accepts a public literal without a lookup', async () => {
    await expect(assertPublicTarget('https://93.184.216.34/doc.md')).resolves.toBeUndefined()
    expect(lookup).not.toHaveBeenCalled()
  })

  it('resolves names and accepts an all-public answer', async () => {
    lookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ])
    await expect(assertPublicTarget(new URL('https://example.com/doc.md'))).resolves.toBeUndefined()
    expect(lookup).toHaveBeenCalledWith('example.com', { all: true })
  })

  it('rejects when any resolved address is private', async () => {
    lookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.7', family: 4 },
    ])
    const mixed = await rejection(assertPublicTarget('https://example.com/doc.md'))
    expect(mixed.status).toBe(400)
    expect(mixed.message).toBe('Target host resolves to a private address')

    lookup.mockResolvedValue([{ address: '::ffff:127.0.0.1', family: 6 }])
    await expect(rejection(assertPublicTarget('https://example.com/doc.md'))).resolves.toBeInstanceOf(SafeFetchError)
  })

  it('rejects an empty or failed lookup', async () => {
    lookup.mockResolvedValue([])
    expect((await rejection(assertPublicTarget('https://example.com/'))).status).toBe(400)
    lookup.mockRejectedValue(new Error('ENOTFOUND'))
    const failed = await rejection(assertPublicTarget('https://example.com/'))
    expect(failed.message).toBe('Target host could not be resolved')
  })
})
