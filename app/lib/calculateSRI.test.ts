import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateSRI } from '@/lib/calculateSRI'

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))

vi.mock('node-fetch', () => ({ default: mockFetch }))

describe('calculateSRI', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns the sha384 digest of the fetched bytes', async () => {
    mockFetch.mockResolvedValue({ ok: true, buffer: async () => Buffer.from('hello') })
    await expect(calculateSRI('https://example.com/file')).resolves.toBe(
      'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP'
    )
  })

  it('throws when the response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' })
    await expect(calculateSRI('https://example.com/missing')).rejects.toThrow('Failed to fetch: Not Found')
  })
})
