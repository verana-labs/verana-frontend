import { indexerValidators } from '@/lib/indexer-json'

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

export type GfOwner = { kind: 'ecosystem'; id: string } | { kind: 'corporation'; id: number }

export function parseGfVersions(value: unknown, label: string, path: string): GfVersion[] {
  const { record, string, number, nullableString, optionalString } = indexerValidators(label)
  if (!Array.isArray(value)) throw new Error(`Invalid ${label} response: ${path}`)
  return value.map((entry, index) => {
    const versionPath = `${path}[${index}]`
    const source = record(entry, versionPath)
    if (!Array.isArray(source.documents)) throw new Error(`Invalid ${label} response: ${versionPath}.documents`)
    return {
      id: String(number(source.id, `${versionPath}.id`)),
      version: number(source.version, `${versionPath}.version`),
      activeSince: nullableString(source.active_since, `${versionPath}.active_since`),
      documents: source.documents.map((document, documentIndex) => {
        const documentPath = `${versionPath}.documents[${documentIndex}]`
        const doc = record(document, documentPath)
        return {
          id: String(number(doc.id, `${documentPath}.id`)),
          url: string(doc.url, `${documentPath}.url`),
          language: string(doc.language, `${documentPath}.language`),
          digestSri: optionalString(doc.digest_sri, `${documentPath}.digest_sri`),
        }
      }),
    }
  })
}

export function editableVersions(versions: GfVersion[], activeVersion: number): number[] {
  const latest = versions.reduce((max, version) => Math.max(max, version.version), activeVersion)
  const drafts = new Set(versions.map((version) => version.version).filter((version) => version > activeVersion))
  return [...drafts].sort((a, b) => a - b).concat(latest + 1)
}

export function nextVersion(versions: GfVersion[], activeVersion: number): GfVersion | undefined {
  return versions.find((version) => version.version === activeVersion + 1 && version.documents.length > 0)
}

export function hasDocumentIn(version: GfVersion, language: string): boolean {
  return version.documents.some((document) => document.language === language)
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
