import type { DeliverTxResponse } from '@cosmjs/stargate'
import { explorerTxLink } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { authorizationRejection } from '@/lib/chain-error'
import { logger } from '@/lib/logger'
import type { TxEvent } from '@/msg/util/txEvents'
import type { NotificationLink } from '@/providers/notification-provider'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'

export type ProposalExecution =
  | { status: 'executed' | 'pending' }
  | { status: 'scheduled'; proposalId: string; executableFrom: Date }
  | { status: 'failed'; proposalId: string; logs: string }

export interface TxNotice {
  message: string
  title: string
  link?: NotificationLink
}

const EVENT_EXEC = 'cosmos.group.v1.EventExec'
const FAILED_LOGS_PREFIX = /^proposal execution failed on proposal \d+, because of error /
const MUST_WAIT = /must wait until (.+?) to execute proposal/
const CHAIN_TIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d{1,3})?\d* ([+-]\d{2})(\d{2})/

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

function typedEventValue(event: TxEvent, key: string): string {
  const raw = event.attributes.find((attribute) => attribute.key === key)?.value ?? ''
  if (!raw.startsWith('"')) return raw
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : raw
  } catch {
    return raw
  }
}

function chainTime(value: string): Date | null {
  const match = CHAIN_TIME.exec(value)
  if (!match) return null
  const date = new Date(`${match[1]}T${match[2]}${match[3] ?? ''}${match[4]}:${match[5]}`)
  return Number.isNaN(date.getTime()) ? null : date
}

function execution(event: TxEvent): ProposalExecution {
  const result = typedEventValue(event, 'result')
  if (result === 'PROPOSAL_EXECUTOR_RESULT_SUCCESS') return { status: 'executed' }
  if (result !== 'PROPOSAL_EXECUTOR_RESULT_FAILURE') return { status: 'pending' }
  const proposalId = typedEventValue(event, 'proposal_id')
  const logs = typedEventValue(event, 'logs').replace(FAILED_LOGS_PREFIX, '')
  const wait = MUST_WAIT.exec(logs)
  const executableFrom = wait ? chainTime(wait[1]) : null
  return executableFrom ? { status: 'scheduled', proposalId, executableFrom } : { status: 'failed', proposalId, logs }
}

export function proposalExecution(events: readonly TxEvent[]): ProposalExecution {
  const executions = events.filter((event) => event.type === EVENT_EXEC).map(execution)
  return (
    executions.find((candidate) => candidate.status === 'failed') ??
    executions.find((candidate) => candidate.status === 'executed') ??
    executions.find((candidate) => candidate.status === 'scheduled') ?? { status: 'pending' }
  )
}

const SUBMITTED_TX = /Transaction with ID ([0-9A-F]{64}) was submitted/

export function rejectionNotice(fallback: string, text: string): TxNotice {
  const reason = authorizationRejection(text)
  const submitted = SUBMITTED_TX.exec(text)?.[1]
  if (!reason) {
    return {
      message: fallback,
      title: t('notification.msg.failed.title'),
      link: submitted ? explorerTxLink(submitted) : undefined,
    }
  }
  logger.error('authorization rejection', text)
  return { message: t('notification.msg.unauthorized', { reason }), title: t('notification.msg.unauthorized.title') }
}

export function txFailureNotice(
  result: DeliverTxResponse,
  fallback: (code: number, rawLog: string) => string
): TxNotice | null {
  const rawLog = result.rawLog ?? ''
  const link = explorerTxLink(result.transactionHash)
  if (result.code !== 0) return { ...rejectionNotice(fallback(result.code, rawLog), rawLog), link }
  const outcome = proposalExecution(result.events)
  if (outcome.status !== 'failed') return null
  const reason = authorizationRejection(outcome.logs)
  logger.error('proposal execution failed', outcome.logs)
  return {
    message: t(reason ? 'notification.proposal.unauthorized' : 'notification.proposal.failed', {
      id: outcome.proposalId,
      reason: reason ?? outcome.logs,
    }),
    title: t('notification.proposal.failed.title'),
    link,
  }
}

export function proposalSubmittedMessage(events: readonly TxEvent[]): string {
  const outcome = proposalExecution(events)
  if (outcome.status === 'scheduled') {
    return t('notification.MsgSubmitProposal.scheduled', {
      id: outcome.proposalId,
      date: outcome.executableFrom.toLocaleString(),
    })
  }
  return t(
    outcome.status === 'executed' ? 'notification.MsgSubmitProposal.executed' : 'notification.MsgSubmitProposal.pending'
  )
}
