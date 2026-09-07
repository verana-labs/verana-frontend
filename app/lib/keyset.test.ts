import { describe, expect, it } from 'vitest'
import { firstPage, isPartial, type KeysetRequest, keysetNext, keysetPrev, keysetQuery, keysetWindow } from './keyset'

type Row = { id: number }
const idOf = (row: Row) => row.id

function indexer(ids: number[]) {
  return (query: Record<string, string>): Row[] => {
    const limit = Number(query.limit)
    const minId = query.min_id === undefined ? undefined : Number(query.min_id)
    const maxId = query.max_id === undefined ? undefined : Number(query.max_id)
    const sorted = [...ids].sort((a, b) => (query.sort === '-id' ? b - a : a - b))
    return sorted
      .filter((id) => (minId === undefined || id >= minId) && (maxId === undefined || id < maxId))
      .slice(0, limit)
      .map((id) => ({ id }))
  }
}

describe('keysetQuery', () => {
  it('over-fetches one row and sends no cursor for the first page', () => {
    expect(keysetQuery(firstPage(9))).toEqual({ limit: '10', sort: '-id' })
  })

  it('pages forward with an exclusive max_id when displaying newest first', () => {
    expect(keysetQuery({ limit: 9, sort: '-id', direction: 'forward', boundary: 40 })).toEqual({
      limit: '10',
      sort: '-id',
      max_id: '40',
    })
  })

  it('pages backward by flipping the sort and using an inclusive min_id past the boundary', () => {
    expect(keysetQuery({ limit: 9, sort: '-id', direction: 'backward', boundary: 40 })).toEqual({
      limit: '10',
      sort: '+id',
      min_id: '41',
    })
  })

  it('mirrors both cursors when displaying oldest first', () => {
    expect(keysetQuery({ limit: 5, sort: '+id', direction: 'forward', boundary: 7 })).toMatchObject({
      sort: '+id',
      min_id: '8',
    })
    expect(keysetQuery({ limit: 5, sort: '+id', direction: 'backward', boundary: 7 })).toMatchObject({
      sort: '-id',
      max_id: '7',
    })
  })
})

describe('keysetWindow', () => {
  it('trims the extra row and reports a next page on the first window', () => {
    const window = keysetWindow(firstPage(2), [{ id: 9 }, { id: 8 }, { id: 7 }])
    expect(window).toEqual({ rows: [{ id: 9 }, { id: 8 }], hasPrev: false, hasNext: true })
    expect(isPartial(window)).toBe(true)
  })

  it('reports a previous page after paging forward even when the last window is short', () => {
    const request: KeysetRequest = { limit: 2, sort: '-id', direction: 'forward', boundary: 7 }
    const window = keysetWindow(request, [{ id: 6 }])
    expect(window).toEqual({ rows: [{ id: 6 }], hasPrev: true, hasNext: false })
  })

  it('restores the display order after a backward fetch', () => {
    const request: KeysetRequest = { limit: 2, sort: '-id', direction: 'backward', boundary: 6 }
    const window = keysetWindow(request, [{ id: 7 }, { id: 8 }, { id: 9 }])
    expect(window).toEqual({ rows: [{ id: 8 }, { id: 7 }], hasPrev: true, hasNext: true })
  })

  it('is complete when a single window holds everything', () => {
    const window = keysetWindow(firstPage(5), [{ id: 2 }, { id: 1 }])
    expect(isPartial(window)).toBe(false)
  })
})

describe('keysetNext and keysetPrev', () => {
  it('walk a twelve row list newest first in windows of five and back to the first page', () => {
    const serve = indexer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    let request = firstPage(5)
    let window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([12, 11, 10, 9, 8])
    expect(keysetPrev(request, window, idOf)).toBeUndefined()

    request = keysetNext(request, window, idOf) ?? request
    window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([7, 6, 5, 4, 3])
    expect(window).toMatchObject({ hasPrev: true, hasNext: true })

    request = keysetNext(request, window, idOf) ?? request
    window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([2, 1])
    expect(window).toMatchObject({ hasPrev: true, hasNext: false })
    expect(keysetNext(request, window, idOf)).toBeUndefined()

    request = keysetPrev(request, window, idOf) ?? request
    window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([7, 6, 5, 4, 3])
    expect(window).toMatchObject({ hasPrev: true, hasNext: true })

    request = keysetPrev(request, window, idOf) ?? request
    window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([12, 11, 10, 9, 8])
    expect(window).toMatchObject({ hasPrev: false, hasNext: true })
  })

  it('walk oldest first with the mirrored cursors', () => {
    const serve = indexer([3, 4, 5, 6, 7])
    let request = firstPage(2, '+id')
    let window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([3, 4])

    request = keysetNext(request, window, idOf) ?? request
    window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([5, 6])

    request = keysetPrev(request, window, idOf) ?? request
    window = keysetWindow(request, serve(keysetQuery(request)))
    expect(window.rows.map(idOf)).toEqual([3, 4])
    expect(window).toMatchObject({ hasPrev: false, hasNext: true })
  })

  it('return nothing for an empty window', () => {
    const request = firstPage(3)
    const window = keysetWindow(request, [])
    expect(keysetNext(request, window, idOf)).toBeUndefined()
    expect(keysetPrev(request, window, idOf)).toBeUndefined()
  })
})
