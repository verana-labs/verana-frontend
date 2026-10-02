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

function newestFirst(a: ActivityRow, b: ActivityRow): number {
  const byTime = Date.parse(b.timestamp) - Date.parse(a.timestamp)
  if (Number.isFinite(byTime) && byTime !== 0) return byTime
  return b.blockHeight - a.blockHeight || b.id - a.id
}

export function parseActivityHistory(payload: unknown): ActivityRow[] {
  const envelope = record(payload, 'history response')
  if (!Array.isArray(envelope.activity)) throw new Error('Invalid activity history response: activity')
  return envelope.activity
    .map((entry, index) => {
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
    .filter((row) => !NON_VPR_MESSAGES.has(row.msg))
    .sort(newestFirst)
}

export async function fetchActivityHistory(url: string): Promise<ActivityRow[]> {
  return parseActivityHistory(await fetchJson(url, 'Unable to fetch the history'))
}
