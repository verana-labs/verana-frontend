import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, dataTableColumns } from '@/ui/common/data-table/data-table'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

type Item = { id: string; name: string; score: number }

const helper = dataTableColumns<Item>()
const COLUMNS = helper.columns([
  helper.accessor('name', { header: 'Name' }),
  helper.accessor('score', { header: 'Score', meta: { align: 'end' } }),
])

const DATA: Item[] = Array.from({ length: 12 }, (_, index) => ({
  id: String(index + 1),
  name: `item-${String(index + 1).padStart(2, '0')}`,
  score: index + 1,
}))

function bodyRows(html: string): number {
  return (html.match(/data-row-id=/g) ?? []).length
}

describe('DataTable', () => {
  it('renders every row without a page size', () => {
    const html = renderToStaticMarkup(<DataTable columns={COLUMNS} data={DATA} label="Items" />)
    expect(bodyRows(html)).toBe(12)
    expect(html).toContain('data-status="ready"')
  })

  it('sorts by the default sorting', () => {
    const html = renderToStaticMarkup(
      <DataTable columns={COLUMNS} data={DATA} label="Items" defaultSorting={[{ id: 'score', desc: true }]} />
    )
    expect(html.indexOf('item-12')).toBeLessThan(html.indexOf('item-01'))
    expect(html).toContain('aria-sort="descending"')
  })

  it('filters rows with the search value', () => {
    const html = renderToStaticMarkup(<DataTable columns={COLUMNS} data={DATA} label="Items" search="item-1" />)
    expect(bodyRows(html)).toBe(3)
  })

  it('shows the no match state when the search hides every row', () => {
    const html = renderToStaticMarkup(<DataTable columns={COLUMNS} data={DATA} label="Items" search="zzz" />)
    expect(html).toContain('data-status="empty"')
    expect(html).toContain('No results match your search.')
  })

  it('paginates and renders the pager', () => {
    const html = renderToStaticMarkup(<DataTable columns={COLUMNS} data={DATA} label="Items" pageSize={5} />)
    expect(bodyRows(html)).toBe(5)
    expect(html).toContain('1-5 of 12')
    expect(html).toContain('aria-current="page"')
  })

  it('renders skeleton rows while loading and the empty message when there is no data', () => {
    const loading = renderToStaticMarkup(<DataTable columns={COLUMNS} data={null} label="Items" />)
    expect(loading).toContain('data-status="loading"')
    const empty = renderToStaticMarkup(<DataTable columns={COLUMNS} data={[]} label="Items" empty="No items" />)
    expect(empty).toContain('No items')
  })
})
