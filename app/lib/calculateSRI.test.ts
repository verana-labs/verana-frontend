import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateSRI } from '@/lib/calculateSRI'

const { mockSafeFetch } = vi.hoisted(() => ({ mockSafeFetch: vi.fn() }))

vi.mock('@/lib/safe-fetch', () => ({ safeFetch: mockSafeFetch }))

describe('calculateSRI', () => {
  beforeEach(() => {
    mockSafeFetch.mockReset()
  })

  it('returns the sha384 digest of the fetched bytes', async () => {
    mockSafeFetch.mockResolvedValue({ bytes: new TextEncoder().encode('hello'), contentType: null })
    await expect(calculateSRI('https://example.com/file')).resolves.toBe(
      'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP'
    )
    expect(mockSafeFetch).toHaveBeenCalledWith('https://example.com/file')
  })

  it('digests the raw file behind a github blob url, as the browser does', async () => {
    mockSafeFetch.mockResolvedValue({ bytes: new TextEncoder().encode('hello'), contentType: null })
    await calculateSRI('https://github.com/verana-labs/gov/blob/main/egf.md')
    expect(mockSafeFetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/verana-labs/gov/main/egf.md')
  })

  it('propagates fetch failures', async () => {
    mockSafeFetch.mockRejectedValue(new Error('Upstream responded 404'))
    await expect(calculateSRI('https://example.com/missing')).rejects.toThrow('Upstream responded 404')
  })
})
