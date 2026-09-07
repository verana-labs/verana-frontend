import { describe, expect, it } from 'vitest'
import { digestsMatch, parseSriDigest, sha384Sri } from '@/lib/document-verification'

const HELLO = 'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP'

describe('parseSriDigest', () => {
  it('accepts a sha384 digest and rejects everything else', () => {
    expect(parseSriDigest(HELLO)).toBe(HELLO.slice('sha384-'.length))
    expect(parseSriDigest('sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=')).toBeNull()
    expect(parseSriDigest('sha384-acme')).toBeNull()
    expect(parseSriDigest('')).toBeNull()
    expect(parseSriDigest(undefined)).toBeNull()
  })
})

describe('sha384Sri', () => {
  it('hashes bytes into the sri form', async () => {
    await expect(sha384Sri(new TextEncoder().encode('hello'))).resolves.toBe(HELLO)
  })
})

describe('digestsMatch', () => {
  it('compares parsed sha384 digests only', () => {
    expect(digestsMatch(HELLO, HELLO)).toBe(true)
    expect(digestsMatch(HELLO, `sha384-${'A'.repeat(64)}`)).toBe(false)
    expect(digestsMatch(HELLO, 'sha384-acme')).toBe(false)
    expect(digestsMatch(HELLO, undefined)).toBe(false)
  })
})
