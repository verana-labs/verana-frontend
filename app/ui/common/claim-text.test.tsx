import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ClaimText from '@/ui/common/claim-text'

function renderMarkdown(text: string): string {
  return renderToStaticMarkup(<ClaimText text={text} format="text/markdown" />)
}

describe('ClaimText', () => {
  it('drops a javascript: link and keeps its text', () => {
    const html = renderMarkdown('[click me](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<a')
    expect(html).toContain('click me')
  })

  it('opens a safe link outside the application', () => {
    const html = renderMarkdown('[terms](https://service.example/terms)')
    expect(html).toContain('href="https://service.example/terms"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('renders a Markdown image as its alt text, never as an image', () => {
    const html = renderMarkdown('![the logo](https://remote.example/logo.svg)')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('https://remote.example/logo.svg')
    expect(html).toContain('the logo')
  })

  it('drops a Markdown image that has no alt text', () => {
    const html = renderMarkdown('![](https://remote.example/logo.svg)')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('https://remote.example/logo.svg')
  })
})
