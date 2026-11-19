import { createHash } from 'node:crypto'
import { fromBase64 } from '@cosmjs/encoding'
import type { BrowserContext, Page } from '@playwright/test'
import type { LiveEnv } from './env'

export type TxEvent = { type: string; attributes: { key: string; value: string }[] }
export type TxResponse = { txhash: string; code: number; raw_log: string; height: string; events: TxEvent[] }
export type FetchedTx = { response: TxResponse; types: string[] }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function hashOf(base64Tx: string): string {
  return createHash('sha256').update(fromBase64(base64Tx)).digest('hex').toUpperCase()
}

function broadcastedTx(postData: string | null): string | undefined {
  if (!postData) return undefined
  try {
    const body: unknown = JSON.parse(postData)
    if (typeof body !== 'object' || body === null) return undefined
    const record = body as Record<string, unknown>
    const params = record.params as Record<string, unknown> | undefined
    if (
      typeof record.method === 'string' &&
      record.method.startsWith('broadcast_tx') &&
      typeof params?.tx === 'string'
    ) {
      return params.tx
    }
    if (typeof record.tx_bytes === 'string') return record.tx_bytes
  } catch {}
  return undefined
}

export class TxWatcher {
  private readonly seen: string[] = []

  constructor(context: BrowserContext) {
    context.on('request', (request) => {
      if (request.method() !== 'POST') return
      const tx = broadcastedTx(request.postData())
      if (tx) this.seen.push(hashOf(tx))
    })
  }

  mark(): number {
    return this.seen.length
  }

  async next(mark: number, timeoutMs: number): Promise<string | undefined> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (this.seen.length > mark) return this.seen[this.seen.length - 1]
      await sleep(250)
    }
    return undefined
  }
}

export async function hashFromPage(page: Page, timeoutMs: number): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
    for (const href of hrefs) {
      const found = href.match(/\b[0-9a-fA-F]{64}\b/)
      if (found && /tx/i.test(href)) return found[0].toUpperCase()
    }
    await sleep(500)
  }
  return undefined
}

function collectTypes(node: unknown, into: string[]): string[] {
  if (Array.isArray(node)) {
    for (const entry of node) collectTypes(entry, into)
  } else if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      if (key === '@type' && typeof value === 'string') into.push(value)
      else collectTypes(value, into)
    }
  }
  return into
}

export async function waitForTx(env: LiveEnv, hash: string, timeoutMs = 120_000): Promise<FetchedTx> {
  const deadline = Date.now() + timeoutMs
  let last = 'no response'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${env.rest}/cosmos/tx/v1beta1/txs/${hash}`)
      if (response.ok) {
        const payload = (await response.json()) as { tx?: { body?: { messages?: unknown } }; tx_response: TxResponse }
        return { response: payload.tx_response, types: collectTypes(payload.tx?.body?.messages, []) }
      }
      last = `HTTP ${response.status}`
    } catch (error) {
      last = error instanceof Error ? error.message : String(error)
    }
    await sleep(2_000)
  }
  throw new Error(`tx ${hash} was not found on ${env.rest} within ${timeoutMs}ms (${last})`)
}

export function eventAttribute(events: TxEvent[], type: string, key: string): string | undefined {
  for (const event of events) {
    if (event.type !== type) continue
    const attribute = event.attributes.find((entry) => entry.key === key)
    if (attribute) return attribute.value.replace(/^"|"$/g, '')
  }
  return undefined
}

export type ProposalOutcome = 'executed' | 'pending'

export function proposalExecutorResult(events: TxEvent[]): string | undefined {
  return eventAttribute(events, 'cosmos.group.v1.EventExec', 'result')
}

export function assertTxSucceeded(fetched: FetchedTx, expectedTypes: string[], outcome?: ProposalOutcome): void {
  const { response } = fetched
  if (response.code !== 0)
    throw new Error(`tx ${response.txhash} failed on chain: code=${response.code} log=${response.raw_log}`)
  for (const type of expectedTypes) {
    if (!fetched.types.includes(type)) {
      throw new Error(`tx ${response.txhash} does not carry ${type}, it carries: ${fetched.types.join(', ')}`)
    }
  }
  if (!outcome) return
  const result = proposalExecutorResult(response.events)
  const executed = result === 'PROPOSAL_EXECUTOR_RESULT_SUCCESS'
  if (outcome === 'executed' && !executed) {
    throw new Error(
      `tx ${response.txhash} succeeded but the group proposal did not execute (executor result: ${result ?? 'none'})`
    )
  }
  if (outcome === 'pending' && result && result !== 'PROPOSAL_EXECUTOR_RESULT_NOT_RUN') {
    throw new Error(`tx ${response.txhash} was expected to leave the proposal pending (executor result: ${result})`)
  }
}

export async function uvnaBalance(env: LiveEnv, address: string): Promise<bigint> {
  const response = await fetch(`${env.rest}/cosmos/bank/v1beta1/balances/${address}`)
  if (!response.ok) throw new Error(`balance lookup for ${address} answered HTTP ${response.status}`)
  const payload = (await response.json()) as { balances?: { denom: string; amount: string }[] }
  return BigInt(payload.balances?.find((coin) => coin.denom === 'uvna')?.amount ?? '0')
}

export type GroupProposal = { id: string; status: string }

export async function latestGroupProposal(env: LiveEnv, policyAddress: string): Promise<GroupProposal | undefined> {
  const response = await fetch(`${env.rest}/cosmos/group/v1/proposals_by_group_policy/${policyAddress}`)
  if (!response.ok) throw new Error(`proposal lookup for ${policyAddress} answered HTTP ${response.status}`)
  const payload = (await response.json()) as { proposals?: GroupProposal[] }
  return payload.proposals?.at(-1)
}

export async function indexerList(env: LiveEnv, path: string, key: string): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${env.indexer}/v4/${path}`)
  if (!response.ok) throw new Error(`${path} answered HTTP ${response.status}`)
  const payload = (await response.json()) as Record<string, unknown>
  return Array.isArray(payload[key]) ? (payload[key] as Record<string, unknown>[]) : []
}
