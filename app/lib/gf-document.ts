export type GfDocumentKind = 'pdf' | 'markdown' | 'html'

export type GfDocument = {
  id: string
  url: string
  language: string
  digestSri?: string
}

export type GfVersion = {
  id: string
  version: number
  activeSince: string | null
  documents: GfDocument[]
}

export function kindFromUrl(url: string): GfDocumentKind | undefined {
  let pathname: string
  try {
    pathname = new URL(url).pathname.toLowerCase()
  } catch {
    return undefined
  }
  if (pathname.endsWith('.pdf')) return 'pdf'
  if (pathname.endsWith('.md') || pathname.endsWith('.markdown')) return 'markdown'
  if (pathname.endsWith('.html') || pathname.endsWith('.htm')) return 'html'
  return undefined
}

export function kindFromContentType(contentType: string | null | undefined): GfDocumentKind | undefined {
  if (!contentType) return undefined
  const mime = contentType.split(';')[0].trim().toLowerCase()
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'text/markdown' || mime === 'text/x-markdown') return 'markdown'
  if (mime === 'text/html') return 'html'
  return undefined
}

export function fetchableDocumentUrl(url: string): string {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url)
  if (match) return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`
  return url
}

const FALLBACK_FILE_NAMES: Record<GfDocumentKind, string> = {
  markdown: 'governance-framework.md',
  html: 'governance-framework.html',
  pdf: 'governance-framework.pdf',
}

export function documentFileName(url: string, kind?: GfDocumentKind): string {
  const fallback = kind ? FALLBACK_FILE_NAMES[kind] : 'governance-framework'
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (!last) return fallback
    return decodeURIComponent(last)
  } catch {
    return fallback
  }
}

export function displayedVersion(versions: GfVersion[], activeVersion: number): GfVersion | undefined {
  return versions.find((version) => version.version === activeVersion) ?? versions.at(-1)
}
