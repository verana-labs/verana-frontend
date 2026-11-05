'use client'

import { LandmarkIcon } from 'lucide-react'
import type { CorporationTrustDeposit } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { EmptyState } from '@/ui/common/empty-state'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { Button } from '@/ui/shadcn/button'
import { formatVNAFromUVNA } from '@/util/util'
import { Card, Fact, formatDate, SectionUnavailable } from './shared'

const FACT_TILE = 'rounded-lg bg-tint-neutral px-4 py-3'

export function TrustDepositSection({
  trustDeposit,
  unrepaidSlash,
  repayMode,
  degraded,
  onRepay,
}: {
  trustDeposit: CorporationTrustDeposit | null
  unrepaidSlash: number
  repayMode: CorporationSigningMode | null
  degraded: boolean
  onRepay: () => void
}) {
  return (
    <Card id="deposit">
      {trustDeposit ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Fact
              label={translate('corporation.page.deposit')}
              value={formatVNAFromUVNA(String(trustDeposit.deposit))}
              className={FACT_TILE}
            />
            <Fact
              label={translate('corporation.page.slashed')}
              value={`${formatVNAFromUVNA(String(trustDeposit.slashedDeposit))} (${trustDeposit.slashCount})`}
              className={FACT_TILE}
            />
            <Fact
              label={translate('corporation.page.repaid')}
              value={formatVNAFromUVNA(String(trustDeposit.repaidDeposit))}
              className={FACT_TILE}
            />
            <Fact
              label={translate('corporation.page.lastslashed')}
              value={formatDate(trustDeposit.lastSlashed)}
              className={FACT_TILE}
            />
            <Fact
              label={translate('corporation.page.lastrepaid')}
              value={formatDate(trustDeposit.lastRepaid)}
              className={FACT_TILE}
            />
          </div>
          {unrepaidSlash > 0 && repayMode ? (
            <Button type="button" size="lg" onClick={onRepay} className="mt-4 gap-2">
              <SigningModeIcon mode={repayMode} />
              {translate('corporation.page.repayslashed')} ({formatVNAFromUVNA(String(unrepaidSlash))})
            </Button>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{translate('corporation.page.trustdeposit.note')}</p>
        </>
      ) : degraded ? (
        <SectionUnavailable />
      ) : (
        <EmptyState icon={<LandmarkIcon />} title={translate('corporation.page.trustdeposit.empty')} />
      )}
    </Card>
  )
}
