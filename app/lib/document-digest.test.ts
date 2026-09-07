import { describe, expect, it, vi } from 'vitest'
import { fetchDocumentDigest } from '@/lib/document-digest'

function fetchReturning(body: unknown, ok = true): typeof fetch {
  return vi.fn(async () => ({ ok, json: async () => body })) as unknown as typeof fetch
}

describe('fetchDocumentDigest', () => {
  it('asks the digest route for an http(s) url', async () => {
    const impl = fetchReturning({ sri: 'sha384-abc' })
    await expect(fetchDocumentDigest('https://x.example/doc.md', impl)).resolves.toBe('sha384-abc')
    expect(impl).toHaveBeenCalledWith('/api/sri?url=https%3A%2F%2Fx.example%2Fdoc.md')
  })

  it('rejects other schemes without calling the route', async () => {
    const impl = fetchReturning({ sri: 'sha384-abc' })
    await expect(fetchDocumentDigest('ftp://x.example/doc.md', impl)).rejects.toThrow('Invalid document URL')
    expect(impl).not.toHaveBeenCalled()
  })

  it('rejects route failures and malformed answers', async () => {
    await expect(fetchDocumentDigest('https://x.example/doc.md', fetchReturning({}, false))).rejects.toThrow(
      'Unable to calculate the document digest'
    )
    await expect(fetchDocumentDigest('https://x.example/doc.md', fetchReturning({ sri: '' }))).rejects.toThrow(
      'Invalid document digest response'
    )
    await expect(fetchDocumentDigest('https://x.example/doc.md', fetchReturning([]))).rejects.toThrow(
      'Invalid document digest response'
    )
  })
})
