export function indexerValidators(label: string) {
  const invalid = (path: string) => new Error(`Invalid ${label} response: ${path}`)

  function record(value: unknown, path: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(path)
    return value as Record<string, unknown>
  }

  function string(value: unknown, path: string): string {
    if (typeof value !== 'string') throw invalid(path)
    return value
  }

  function number(value: unknown, path: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(path)
    return value
  }

  function integer(value: unknown, path: string): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw invalid(path)
    return value
  }

  function scaledShare(value: unknown, path: string): number {
    // The V4 indexer serializes the 1e18-scaled share as a JSON number, so it is legitimately above MAX_SAFE_INTEGER.
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) throw invalid(path)
    return value
  }

  function decimalAmount(value: unknown, path: string): string {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
    if (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)) return value
    throw invalid(path)
  }

  function nullableString(value: unknown, path: string): string | null {
    if (value === null) return null
    return string(value, path)
  }

  function optionalString(value: unknown, path: string): string | undefined {
    if (value === undefined) return undefined
    return string(value, path)
  }

  function stringArray(value: unknown, path: string): string[] {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) throw invalid(path)
    return value
  }

  return {
    record,
    string,
    number,
    integer,
    scaledShare,
    decimalAmount,
    nullableString,
    nullableTimestamp: nullableString,
    optionalString,
    stringArray,
  }
}

export type KeysetSort = '+id' | '-id'

export interface KeysetPageRequest {
  pageSize: number
  after?: string
  sort?: KeysetSort
}

// Add the keyset page parameters of [VFE-DATA-IDX-1]. The indexer excludes
// `max_id` and includes `min_id`, so the ascending cursor starts one id later.
export function applyKeysetParams(params: URLSearchParams, request: KeysetPageRequest): void {
  const sort = request.sort ?? '-id'
  params.set('limit', String(request.pageSize + 1))
  params.set('sort', sort)
  if (request.after === undefined) return
  if (sort === '-id') params.set('max_id', request.after)
  else params.set('min_id', (BigInt(request.after) + BigInt(1)).toString())
}

// Split the extra row off the window. The indexer returns no total count, so
// that row is the only next-page signal of [VFE-DATA-IDX-1].
export function takeKeysetPage<T>(window: T[], pageSize: number): { items: T[]; hasNext: boolean } {
  return { items: window.slice(0, pageSize), hasNext: window.length > pageSize }
}
