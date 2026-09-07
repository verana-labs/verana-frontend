import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { resolveTranslatable } from '@/ui/dataview/types'

type WaitForBlock = (targetHeight: number, timeoutMs?: number) => Promise<void>

type SuccessfulTxNotification = {
  message: string
  type: 'success'
  title: string
}

export async function waitForIndexerAfterTx(waitForBlock: WaitForBlock, txHeight: number): Promise<boolean> {
  try {
    await waitForBlock(txHeight)
    return true
  } catch (error) {
    logger.warn('Indexer did not reach confirmed transaction height', { txHeight, error })
    return false
  }
}

export function runAfterIndexerCatchesUp(
  waitForBlock: WaitForBlock,
  txHeight: number,
  refresh: () => void | Promise<void>
): void {
  void waitForBlock(txHeight, 0)
    .then(refresh)
    .catch((error) => logger.warn('Deferred indexer refresh failed', { txHeight, error }))
}

export function successfulTxNotification(
  successMessage: string,
  txHeight: number,
  indexed: boolean
): SuccessfulTxNotification {
  if (indexed) {
    return {
      message: successMessage,
      type: 'success',
      title: resolveTranslatable({ key: 'notification.msg.successful.title' }, translate) ?? 'Transaction successful',
    }
  }

  const pendingMessage =
    resolveTranslatable(
      {
        key: 'notification.msg.indexer.pending',
        values: { height: txHeight },
      },
      translate
    ) ??
    `Confirmed on-chain at block ${txHeight}, but the indexer has not caught up yet. Displayed data may still be stale.`

  return {
    message: `${successMessage} ${pendingMessage}`,
    type: 'success',
    title: resolveTranslatable({ key: 'notification.msg.confirmed.title' }, translate) ?? 'Transaction confirmed',
  }
}
