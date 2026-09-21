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
    <div className={`flex items-start justify-between gap-4 ${strong ? 'font-semibold' : ''}`}>
      <dt className="text-gray-700 dark:text-gray-300 break-all">{label}</dt>
      <dd className="font-mono text-gray-900 dark:text-white whitespace-nowrap">
        {formatVNAFromUVNA(String(amountUvna))}
      </dd>
    </div>
  )
}

export function FeeDistributionPreview({ participant }: { participant: Participant }) {
  const beneficiaries = useBeneficiaries(participant)
  const { trustDepositRate } = useProtocolParams()
  const distribution = useMemo(
    () => (beneficiaries ? feeDistribution(participant, beneficiaries, trustDepositRate) : null),
    [beneficiaries, participant, trustDepositRate]
  )
  if (!distribution || distribution.beneficiaries.length === 0) return null

  return (
    <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4" data-testid="fee-distribution">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('title')}</h4>
      <p className="text-xs text-neutral-70 mb-3">{t(distribution.kind)}</p>
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
