import { isValidHttpUrl } from '@/util/validations'

export async function fetchDocumentDigest(docUrl: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!isValidHttpUrl(docUrl)) throw new Error('Invalid document URL')
  const response = await fetchImpl(`/api/sri?url=${encodeURIComponent(docUrl)}`)
  if (!response.ok) throw new Error('Unable to calculate the document digest')
  const payload: unknown = await response.json()
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid document digest response')
  }
  const sri = (payload as Record<string, unknown>).sri
  if (typeof sri !== 'string' || sri.length === 0) throw new Error('Invalid document digest response')
  return sri
}
