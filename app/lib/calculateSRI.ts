import { sha384Sri } from '@/lib/document-verification'
import { fetchableDocumentUrl } from '@/lib/gf-document'
import { safeFetch } from '@/lib/safe-fetch'

export async function calculateSRI(url: string): Promise<string> {
  const { bytes } = await safeFetch(fetchableDocumentUrl(url))
  return sha384Sri(bytes)
}
