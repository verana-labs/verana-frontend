import { describe, expect, it } from 'vitest'
import { documentFileName, fetchableDocumentUrl, kindFromContentType, kindFromUrl } from '@/lib/gf-document'

describe('kindFromUrl', () => {
  it('detects pdf and markdown extensions', () => {
    expect(kindFromUrl('https://x.example/docs/egf.pdf')).toBe('pdf')
    expect(kindFromUrl('https://x.example/docs/EGF.PDF')).toBe('pdf')
    expect(kindFromUrl('https://x.example/docs/egf.md')).toBe('markdown')
    expect(kindFromUrl('https://x.example/docs/egf.markdown')).toBe('markdown')
  })

  it('ignores query strings and unknown extensions', () => {
    expect(kindFromUrl('https://x.example/docs/egf.pdf?v=2')).toBe('pdf')
    expect(kindFromUrl('https://x.example/page/terms-of-service/')).toBeUndefined()
    expect(kindFromUrl('not a url')).toBeUndefined()
  })
})

describe('kindFromContentType', () => {
  it('maps mime types, with parameters stripped', () => {
    expect(kindFromContentType('application/pdf')).toBe('pdf')
    expect(kindFromContentType('text/markdown; charset=utf-8')).toBe('markdown')
    expect(kindFromContentType('text/x-markdown')).toBe('markdown')
    expect(kindFromContentType('application/octet-stream')).toBeUndefined()
    expect(kindFromContentType(null)).toBeUndefined()
  })
})

describe('fetchableDocumentUrl', () => {
  it('rewrites github blob/raw page URLs to raw.githubusercontent.com', () => {
    expect(fetchableDocumentUrl('https://github.com/verana-labs/verana-council-gov/blob/main/ecs-egf/egf.md')).toBe(
      'https://raw.githubusercontent.com/verana-labs/verana-council-gov/main/ecs-egf/egf.md'
    )
    expect(fetchableDocumentUrl('https://github.com/o/r/raw/main/doc.pdf')).toBe(
      'https://raw.githubusercontent.com/o/r/main/doc.pdf'
    )
  })

  it('leaves every other URL unchanged', () => {
    expect(fetchableDocumentUrl('https://verana-labs.github.io/governance-docs/EGF/example.pdf')).toBe(
      'https://verana-labs.github.io/governance-docs/EGF/example.pdf'
    )
    expect(fetchableDocumentUrl('https://github.com/o/r/releases')).toBe('https://github.com/o/r/releases')
  })
})

describe('documentFileName', () => {
  it('uses the last path segment', () => {
    expect(documentFileName('https://x.example/docs/My%20EGF.pdf')).toBe('My EGF.pdf')
  })

  it('falls back per kind when there is no usable segment', () => {
    expect(documentFileName('https://x.example/', 'markdown')).toBe('governance-framework.md')
    expect(documentFileName('https://x.example/', 'pdf')).toBe('governance-framework.pdf')
    expect(documentFileName('not a url')).toBe('governance-framework.pdf')
  })
})
