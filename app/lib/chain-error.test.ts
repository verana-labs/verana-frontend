import { describe, expect, it, vi } from 'vitest'
import { classifyChainError, type NotifyError, notifyChainRejection } from '@/lib/chain-error'

describe('classifyChainError', () => {
  it('recognizes the delegation module authorization rejections', () => {
    expect(
      classifyChainError('failed to execute message; message index: 0: operator authorization not found: unauthorized')
    ).toBe('unauthorized')
    expect(classifyChainError('rpc error: code = Unknown desc = unauthorized')).toBe('unauthorized')
    expect(classifyChainError('Direct signing failed: msg type not authorized for operator')).toBe('unauthorized')
    expect(classifyChainError('authorization expired')).toBe('unauthorized')
    expect(classifyChainError('verana1abc is not part of group 7')).toBe('unauthorized')
  })

  it('recognizes insufficient funds and sequence mismatches', () => {
    expect(classifyChainError('spendable balance 10uvna is smaller than 20uvna: insufficient funds')).toBe(
      'insufficient_funds'
    )
    expect(classifyChainError('insufficient fees; got: 1uvna required: 500uvna')).toBe('insufficient_funds')
    expect(classifyChainError('account sequence mismatch, expected 8, got 7: incorrect account sequence')).toBe(
      'sequence'
    )
  })

  it('leaves everything else generic', () => {
    expect(classifyChainError('ecosystem 13 is archived')).toBe('other')
    expect(classifyChainError('')).toBe('other')
  })
})

describe('notifyChainRejection', () => {
  const context = { corporation: 'did:web:acme.example', msg: 'MsgArchiveEcosystem' }

  it('keeps the generic notification for non-authorization rejections', async () => {
    const notify = vi.fn<NotifyError>(async () => {})
    await notifyChainRejection(notify, 'ecosystem 13 is archived', 'Unable to archive', context, 'Transaction failed')
    expect(notify).toHaveBeenCalledWith('Unable to archive', 'error', 'Transaction failed')
  })

  it('names the corporation and the message on an authorization rejection and keeps the raw text', async () => {
    const notify = vi.fn<NotifyError>(async () => {})
    await notifyChainRejection(notify, 'operator authorization not found: unauthorized', 'Unable to archive', context)
    const [message, type, title] = notify.mock.calls[0]
    expect(message).toBe('operator authorization not found: unauthorized')
    expect(type).toBe('error')
    expect(title).toContain('MsgArchiveEcosystem')
    expect(title).toContain('did:web:acme.example')
  })

  it('treats a missing raw log as generic', async () => {
    const notify = vi.fn<NotifyError>(async () => {})
    await notifyChainRejection(notify, undefined, 'Unable to archive', context)
    expect(notify).toHaveBeenCalledWith('Unable to archive', 'error', undefined)
  })
})
