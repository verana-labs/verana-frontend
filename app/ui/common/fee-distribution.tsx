'use client'

import { useMemo } from 'react'
import { useBeneficiaries } from '@/hooks/useBeneficiaries'
import { translate } from '@/i18n/dataview'
import { feeDistribution } from '@/lib/fee-distribution'
import { useProtocolParams } from '@/providers/protocol-params-context'
import type { Participant } from '@/ui/dataview/datasections/participant'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { formatVNAFromUVNA, shortenDID } from '@/util/util'

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key: `participantcard.feedistribution.${key}`, values }, translate) ?? key
}

function Row({ label, amountUvna, strong }: { label: string; amountUvna: number; strong?: boolean }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${strong ? 'border-t border-border pt-1 font-semibold' : ''}`}
    >
      <dt className="text-muted-foreground break-all">{label}</dt>
      <dd className="font-mono text-foreground tabular-nums whitespace-nowrap">
        {formatVNAFromUVNA(String(amountUvna))}
      </dd>
    </div>
  )
}

export function FeeDistributionPreview({ participant }: { participant: Participant }) {
  const beneficiaries = useBeneficiaries(participant)
  const { trustDepositRate } = useProtocolParams()
  const distribution = useMemo(
    () =>
      beneficiaries?.status === 'ready'
        ? feeDistribution(participant, beneficiaries.beneficiaries, trustDepositRate)
        : null,
    [beneficiaries, participant, trustDepositRate]
  )
  if (beneficiaries?.status === 'failed') {
    return (
      <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4" data-testid="fee-distribution">
        <h4 className="text-sm font-semibold text-foreground">{t('title')}</h4>
        <p className="mt-1 text-sm text-destructive">{t('failed')}</p>
      </div>
    )
  }
  if (!distribution || distribution.beneficiaries.length === 0) return null

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4" data-testid="fee-distribution">
      <h4 className="text-sm font-semibold text-foreground">{t('title')}</h4>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">{t(distribution.kind)}</p>
      <dl className="space-y-1 text-sm">
        {distribution.beneficiaries.map((beneficiary) => (
          <Row
            key={beneficiary.id}
            label={`${beneficiary.role} #${beneficiary.id}${beneficiary.did ? ` ${shortenDID(beneficiary.did)}` : ''}`}
            amountUvna={beneficiary.amountUvna}
          />
        ))}
        <Row label={t('total')} amountUvna={distribution.totalUvna} strong />
        {distribution.depositUvna !== null && trustDepositRate !== null ? (
          <Row label={t('deposit', { rate: trustDepositRate * 100 })} amountUvna={distribution.depositUvna} />
        ) : null}
      </dl>
    </div>
  )
}
