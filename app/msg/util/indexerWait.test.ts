import { describe, expect, it, vi } from 'vitest'
import { logger } from '@/lib/logger'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from './indexerWait'

describe('waitForIndexerAfterTx', () => {
  it('reports an indexed transaction when the target block is observed', async () => {
    const waitForBlock = vi.fn().mockResolvedValue(undefined)

    await expect(waitForIndexerAfterTx(waitForBlock, 42)).resolves.toBe(true)
    expect(waitForBlock).toHaveBeenCalledWith(42)
  })

  it('keeps a confirmed transaction successful when the indexer wait times out', async () => {
    const timeout = new Error('Timed out waiting for indexer to process block 42')
    const waitForBlock = vi.fn().mockRejectedValue(timeout)
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

    await expect(waitForIndexerAfterTx(waitForBlock, 42)).resolves.toBe(false)
    expect(warn).toHaveBeenCalledWith('Indexer did not reach confirmed transaction height', {
      txHeight: 42,
      error: timeout,
    })
  })
})

describe('runAfterIndexerCatchesUp', () => {
  it('runs a deferred refresh once a later indexer block reaches the transaction height', async () => {
    const waitForBlock = vi.fn().mockResolvedValue(undefined)
    const refresh = vi.fn()

    runAfterIndexerCatchesUp(waitForBlock, 42, refresh)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    expect(waitForBlock).toHaveBeenCalledWith(42, 0)
  })
})

describe('successfulTxNotification', () => {
  it('uses the normal success notification after indexer confirmation', () => {
    expect(successfulTxNotification('Ecosystem updated', 42, true)).toEqual({
      message: 'Ecosystem updated',
      type: 'success',
      title: 'Transaction successful',
    })
  })

  it('distinguishes indexer lag from an on-chain transaction failure', () => {
    expect(successfulTxNotification('Ecosystem updated', 42, false)).toEqual({
      message:
        'Ecosystem updated Confirmed on-chain at block 42, but the indexer has not caught up yet. Displayed data may still be stale.',
      type: 'success',
      title: 'Transaction confirmed',
    })
  })
})
