import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RolePills } from '@/ui/common/role-pills'

describe('RolePills', () => {
  it('puts the controlled marker before the participant roles and folds the rest into +N', () => {
    const html = renderToStaticMarkup(<RolePills roles={['ECOSYSTEM', 'ISSUER', 'VERIFIER']} controlled />)
    expect(html.indexOf('CONTROLLED')).toBeLessThan(html.indexOf('ECOSYSTEM'))
    expect(html).not.toContain('>ISSUER<')
    expect(html).toContain('+2')
    expect(html).toContain('title="ISSUER, VERIFIER"')
  })

  it('never invents an ECOSYSTEM role for a controlled ecosystem without a root participant', () => {
    const html = renderToStaticMarkup(<RolePills roles={[]} controlled />)
    expect(html).toContain('CONTROLLED')
    expect(html).not.toContain('ECOSYSTEM')
  })

  it('keeps a screen reader hint when there is nothing to show', () => {
    expect(renderToStaticMarkup(<RolePills roles={[]} />)).toContain('sr-only')
  })
})
