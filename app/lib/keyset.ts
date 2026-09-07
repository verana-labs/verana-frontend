export type KeysetSort = '+id' | '-id'
export type KeysetDirection = 'forward' | 'backward'

export interface KeysetRequest {
  limit: number
  sort: KeysetSort
  direction: KeysetDirection
  boundary?: number
}

export interface KeysetWindow<T> {
  rows: T[]
  hasPrev: boolean
  hasNext: boolean
}

export interface KeysetPaging {
  hasPrev: boolean
  hasNext: boolean
  partial: boolean
  next: () => void
  prev: () => void
}

export const EMPTY_WINDOW: KeysetWindow<never> = { rows: [], hasPrev: false, hasNext: false }

export function firstPage(limit: number, sort: KeysetSort = '-id'): KeysetRequest {
  return { limit, sort, direction: 'forward' }
}

function flip(sort: KeysetSort): KeysetSort {
  return sort === '-id' ? '+id' : '-id'
}

export function keysetQuery(request: KeysetRequest): Record<string, string> {
  const sort = request.direction === 'forward' ? request.sort : flip(request.sort)
  const query: Record<string, string> = { limit: String(request.limit + 1), sort }
  if (request.boundary === undefined) return query
  if (sort === '-id') query.max_id = String(request.boundary)
  else query.min_id = String(request.boundary + 1)
  return query
}

export function keysetWindow<T>(request: KeysetRequest, fetched: T[]): KeysetWindow<T> {
  const overflow = fetched.length > request.limit
  const rows = overflow ? fetched.slice(0, request.limit) : fetched
  if (request.direction === 'forward') {
    return { rows, hasPrev: request.boundary !== undefined, hasNext: overflow }
  }
  return { rows: [...rows].reverse(), hasPrev: overflow, hasNext: true }
}

export function keysetNext<T>(
  request: KeysetRequest,
  window: KeysetWindow<T>,
  idOf: (row: T) => number
): KeysetRequest | undefined {
  const last = window.rows[window.rows.length - 1]
  if (!window.hasNext || last === undefined) return undefined
  return { limit: request.limit, sort: request.sort, direction: 'forward', boundary: idOf(last) }
}

export function keysetPrev<T>(
  request: KeysetRequest,
  window: KeysetWindow<T>,
  idOf: (row: T) => number
): KeysetRequest | undefined {
  const first = window.rows[0]
  if (!window.hasPrev || first === undefined) return undefined
  return { limit: request.limit, sort: request.sort, direction: 'backward', boundary: idOf(first) }
}

export function isPartial(window: KeysetWindow<unknown>): boolean {
  return window.hasPrev || window.hasNext
}
