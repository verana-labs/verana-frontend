import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

export type ChainErrorKind = 'unauthorized' | 'insufficient_funds' | 'sequence' | 'other'

const SEQUENCE = /account sequence mismatch|incorrect account sequence/i
const INSUFFICIENT_FUNDS = /insufficient funds|insufficient fees?/i
const UNAUTHORIZED =
  /unauthori[sz]ed|not authorized|authorization (?:not found|expired|revoked)|permission denied|not part of group|not a (?:group )?member/i

export function classifyChainError(message: string): ChainErrorKind {
  if (SEQUENCE.test(message)) return 'sequence'
  if (INSUFFICIENT_FUNDS.test(message)) return 'insufficient_funds'
  if (UNAUTHORIZED.test(message)) return 'unauthorized'
  return 'other'
}

export type ChainRejectionContext = {
  corporation: string
  msg: string
}

export function unauthorizedRejectionText(context: ChainRejectionContext): string {
  return resolveTranslatable({ key: 'notification.msg.chain.unauthorized', values: context }, translate) ?? ''
}

export type NotifyError = (message: string, type: 'error', title?: string) => Promise<void>

export async function notifyChainRejection(
  notify: NotifyError,
  raw: string | undefined,
  fallbackMessage: string,
  context: ChainRejectionContext,
  fallbackTitle?: string
): Promise<void> {
  const text = raw ?? ''
  if (classifyChainError(text) !== 'unauthorized') {
    await notify(fallbackMessage, 'error', fallbackTitle)
    return
  }
  await notify(text, 'error', unauthorizedRejectionText(context))
}
