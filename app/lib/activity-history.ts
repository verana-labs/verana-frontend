import { fetchJson, indexerValidators } from '@/lib/indexer-json'

export interface ActivityRow {
  id: number
  timestamp: string
  blockHeight: number
  msg: string
  account: string | null
  changes: Record<string, unknown>
}

const { record, string, integer, nullableString, decimalAmount } = indexerValidators('activity history')

const NON_VPR_MESSAGES = new Set(['StatsUpdate'])
const PAGE_SIZE = 64
const MAX_PAGES = 8

function newestFirst(a: ActivityRow, b: ActivityRow): number {
  const byTime = Date.parse(b.timestamp) - Date.parse(a.timestamp)
  if (Number.isFinite(byTime) && byTime !== 0) return byTime
  return b.blockHeight - a.blockHeight || b.id - a.id
}

function parseActivityItems(payload: unknown): ActivityRow[] {
  const envelope = record(payload, 'history response')
  if (!Array.isArray(envelope.activity)) throw new Error('Invalid activity history response: activity')
  return envelope.activity.map((entry, index) => {
    const row = record(entry, `activity[${index}]`)
    const changes = row.changes
    return {
      id: integer(row.id, `activity[${index}].id`),
      timestamp: string(row.timestamp, `activity[${index}].timestamp`),
      blockHeight: Number(decimalAmount(row.block_height, `activity[${index}].block_height`)),
      msg: string(row.msg, `activity[${index}].msg`),
      account: nullableString(row.account ?? null, `activity[${index}].account`),
      changes: changes === undefined || changes === null ? {} : record(changes, `activity[${index}].changes`),
    }
  })
}

function vprRows(rows: ActivityRow[]): ActivityRow[] {
  return rows.filter((row) => !NON_VPR_MESSAGES.has(row.msg))
}

export function parseActivityHistory(payload: unknown): ActivityRow[] {
  return vprRows(parseActivityItems(payload)).sort(newestFirst)
}

export async function fetchActivityHistory(baseUrl: string): Promise<{ rows: ActivityRow[]; partial: boolean }> {
  const rows: ActivityRow[] = []
  let maxId: number | undefined
  for (let page = 0; page < MAX_PAGES && rows.length < PAGE_SIZE; page++) {
    const url = new URL(baseUrl)
    url.searchParams.set('limit', String(PAGE_SIZE))
    if (maxId !== undefined) url.searchParams.set('max_id', String(maxId))
    const items = parseActivityItems(await fetchJson(url.toString(), 'Unable to fetch the history'))
    rows.push(...vprRows(items))
    if (items.length < PAGE_SIZE) return { rows: rows.sort(newestFirst), partial: false }
    maxId = Math.min(...items.map((item) => item.id))
  }
  return { rows: rows.sort(newestFirst), partial: true }
}
