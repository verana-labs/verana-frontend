import { BroadcastTxError, type DeliverTxResponse } from '@cosmjs/stargate'

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) return String(error.message)
  return String(error)
}

export function isSequenceMismatch(error: unknown): boolean {
  const text = errorText(error)
  return text.includes('account sequence mismatch') || text.includes('incorrect account sequence')
}

export function isBroadcastSequenceMismatch(error: unknown): boolean {
  return error instanceof BroadcastTxError && isSequenceMismatch(error)
}

export function isDeliverTxSequenceMismatch(response: Pick<DeliverTxResponse, 'code'>): boolean {
  return response.code === 32
}

export function expectedSequence(error: unknown): number | undefined {
  const match = /expected\s+(\d+)\s*,\s*got\s+(\d+)/i.exec(errorText(error))
  return match ? Number(match[1]) : undefined
}
