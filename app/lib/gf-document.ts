export type GfDocumentKind = 'pdf' | 'markdown'

/** Detect the document kind from the URL file extension, when it has one. */
export function kindFromUrl(url: string): GfDocumentKind | undefined {
  let pathname: string
  try {
    pathname = new URL(url).pathname.toLowerCase()
  } catch {
    return undefined
  }
  if (pathname.endsWith('.pdf')) return 'pdf'
  if (pathname.endsWith('.md') || pathname.endsWith('.markdown')) return 'markdown'
  return undefined
}

/** Detect the document kind from a Content-Type response header. */
export function kindFromContentType(contentType: string | null | undefined): GfDocumentKind | undefined {
  if (!contentType) return undefined
  const mime = contentType.split(';')[0].trim().toLowerCase()
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'text/markdown' || mime === 'text/x-markdown') return 'markdown'
  return undefined
}

/**
 * URL to fetch the raw document bytes from. GitHub `/blob/` and `/raw/` page
 * URLs serve the HTML UI (or a redirect) without CORS headers, so they are
 * rewritten to raw.githubusercontent.com, which serves the raw file with
 * `access-control-allow-origin: *`. Every other URL is returned unchanged.
 */
export function fetchableDocumentUrl(url: string): string {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url)
  if (match) return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`
  return url
}

/** File name used when downloading the document. */
export function documentFileName(url: string, kind?: GfDocumentKind): string {
  const fallback = kind === 'markdown' ? 'governance-framework.md' : 'governance-framework.pdf'
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (!last) return fallback
    return decodeURIComponent(last)
  } catch {
    return fallback
  }
}
