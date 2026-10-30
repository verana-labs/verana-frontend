'use client'

import { LandmarkIcon } from 'lucide-react'
import type { CorporationTrustDeposit } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { EmptyState } from '@/ui/common/empty-state'
import { KpiStat } from '@/ui/common/kpi-stat'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { ToneTag } from '@/ui/common/tone-tag'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Button } from '@/ui/shadcn/button'
import { formatVNAFromUVNA } from '@/util/util'
import { CategoryBar } from './category-bar'
import { Card, Fact, formatDate, SectionHeader, SectionUnavailable } from './shared'

const FACT_TILE = 'rounded-lg bg-tint-neutral px-4 py-3'

function formatUvna(value: number): string {
  return formatVNAFromUVNA(String(Math.round(value)))
}

function RepaymentMeter({ trustDeposit }: { trustDeposit: CorporationTrustDeposit }) {
  const repaid = Math.min(trustDeposit.repaidDeposit, trustDeposit.slashedDeposit)
  const outstanding = Math.max(trustDeposit.slashedDeposit - trustDeposit.repaidDeposit, 0)
  const legend = [
    { key: 'repaid', label: translate('corporation.page.repaid'), value: repaid, dot: 'bg-success' },
    { key: 'outstanding', label: translate('corporation.page.outstanding'), value: outstanding, dot: 'bg-destructive' },
  ]
  return (
    <div className="space-y-3 rounded-lg bg-tint-neutral p-4">
      <CategoryBar
        segments={[
          { key: 'repaid', value: repaid, className: 'bg-success' },
          { key: 'outstanding', value: outstanding, className: 'bg-destructive' },
        ]}
      />
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {legend.map((entry) => (
          <li key={entry.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${entry.dot}`} />
            {entry.label}
            <span className="font-medium text-foreground tabular-nums">{formatVNAFromUVNA(String(entry.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
  const repay =
    trustDeposit && unrepaidSlash > 0 && repayMode ? (
      <Button type="button" size="lg" onClick={onRepay} className="gap-2">
        <SigningModeIcon mode={repayMode} />
        {translate('corporation.page.repayslashed')} ({formatVNAFromUVNA(String(unrepaidSlash))})
      </Button>
    ) : null
  return (
    <Card id="deposit">
      <SectionHeader
        icon={<LandmarkIcon />}
        title={translate('corporation.tab.deposit')}
        description={trustDeposit ? translate('corporation.page.trustdeposit.note') : null}
        action={repay}
      />
      {trustDeposit ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">
          <div className="relative isolate flex flex-col gap-5 overflow-hidden rounded-xl bg-linear-to-br from-primary/10 via-card to-card p-5 ring-1 ring-primary/10">
            <DotPattern
              width={16}
              height={16}
              className="-z-10 text-primary/25 [mask-image:radial-gradient(240px_circle_at_top_right,white,transparent)] rtl:[mask-image:radial-gradient(240px_circle_at_top_left,white,transparent)]"
            />
            <KpiStat
              size="lg"
              label={translate('corporation.page.deposit')}
              value={<NumberTicker value={trustDeposit.deposit} format={formatUvna} />}
            >
              {unrepaidSlash > 0 ? (
                <ToneTag tone="destructive" dot pulse className="mt-1 w-fit">
                  {translate('corporation.page.outstanding')}
                </ToneTag>
              ) : null}
            </KpiStat>
            {trustDeposit.slashedDeposit > 0 ? <RepaymentMeter trustDeposit={trustDeposit} /> : null}
          </div>
          <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
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
        </div>
      ) : degraded ? (
        <SectionUnavailable />
      ) : (
        <EmptyState icon={<LandmarkIcon />} title={translate('corporation.page.trustdeposit.empty')} />
      )}
    </Card>
  )
}
