'use client'

import { LandmarkIcon } from 'lucide-react'
import type { CorporationTrustDeposit } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Button } from '@/ui/shadcn/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/ui/shadcn/empty'
import { formatVNAFromUVNA } from '@/util/util'
import { CategoryBar } from './category-bar'
import { Card, Fact, formatDate, SectionHeader, SectionUnavailable } from './shared'

function formatUvna(value: number): string {
  return formatVNAFromUVNA(String(Math.round(value)))
}

function SlashBalance({ trustDeposit }: { trustDeposit: CorporationTrustDeposit }) {
  const repaid = Math.min(trustDeposit.repaidDeposit, trustDeposit.slashedDeposit)
  const outstanding = Math.max(trustDeposit.slashedDeposit - trustDeposit.repaidDeposit, 0)
  const legend = [
    { key: 'repaid', label: translate('corporation.page.repaid'), value: repaid, dot: 'bg-success' },
    { key: 'outstanding', label: translate('corporation.page.outstanding'), value: outstanding, dot: 'bg-destructive' },
  ]
  return (
    <div className="space-y-3 rounded-lg bg-muted/50 p-4 ring-1 ring-border/60">
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
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{translate('corporation.page.deposit')}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              <NumberTicker value={trustDeposit.deposit} format={formatUvna} />
            </p>
          </div>
          {trustDeposit.slashedDeposit > 0 ? <SlashBalance trustDeposit={trustDeposit} /> : null}
          <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      ) : degraded ? (
        <SectionUnavailable />
      ) : (
        <Empty className="border border-dashed border-border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LandmarkIcon />
            </EmptyMedia>
            <EmptyDescription>{translate('corporation.page.trustdeposit.empty')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Card>
  )
}
