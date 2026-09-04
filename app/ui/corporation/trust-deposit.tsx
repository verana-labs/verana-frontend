'use client'

import type { CorporationTrustDeposit } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { formatVNAFromUVNA } from '@/util/util'
import { Card, Fact, formatDate } from './shared'

export function TrustDepositSection({
  trustDeposit,
  unrepaidSlash,
  repayMode,
  onRepay,
}: {
  trustDeposit: CorporationTrustDeposit | null
  unrepaidSlash: number
  repayMode: CorporationSigningMode | null
  onRepay: () => void
}) {
  return (
    <Card id="deposit">
      {trustDeposit ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Fact
              label={translate('corporation.page.deposit')}
              value={formatVNAFromUVNA(String(trustDeposit.deposit))}
            />
            <Fact
              label={translate('corporation.page.slashed')}
              value={`${formatVNAFromUVNA(String(trustDeposit.slashedDeposit))} (${trustDeposit.slashCount})`}
            />
            <Fact
              label={translate('corporation.page.repaid')}
              value={formatVNAFromUVNA(String(trustDeposit.repaidDeposit))}
            />
            <Fact label={translate('corporation.page.lastslashed')} value={formatDate(trustDeposit.lastSlashed)} />
            <Fact label={translate('corporation.page.lastrepaid')} value={formatDate(trustDeposit.lastRepaid)} />
          </div>
          {unrepaidSlash > 0 && repayMode ? (
            <button
              type="button"
              onClick={onRepay}
              className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <SigningModeIcon mode={repayMode} />
              {translate('corporation.page.repayslashed')} ({formatVNAFromUVNA(String(unrepaidSlash))})
            </button>
          ) : null}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {translate('corporation.page.trustdeposit.note')}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-500">{translate('corporation.page.trustdeposit.empty')}</p>
      )}
    </Card>
  )
}
