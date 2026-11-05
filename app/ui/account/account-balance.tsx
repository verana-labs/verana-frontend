'use client'

import { WalletIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { BlockCard } from '@/ui/common/block-card'
import { BlurFade } from '@/ui/motion/blur-fade'
import { formatVNAFromUVNA } from '@/util/util'

const DECIMAL_SEPARATOR = new Intl.NumberFormat(undefined).format(1.5).charAt(1)

function splitAmount(balance: string) {
  const formatted = formatVNAFromUVNA(balance).replace(/\s*VNA$/, '')
  const index = formatted.lastIndexOf(DECIMAL_SEPARATOR)
  return index < 0
    ? { whole: formatted, fraction: '' }
    : { whole: formatted.slice(0, index), fraction: formatted.slice(index) }
}

export function AccountBalance({ balance }: { balance: string }) {
  const amount = splitAmount(balance)

  return (
    <BlockCard
      icon={<WalletIcon />}
      title={translate('dataview.account.fields.balance.label')}
      caption={translate('dataview.account.fields.balance.desc')}
      pattern
      className="h-full"
      contentClassName="justify-between gap-6 pt-6"
    >
      <div aria-live="polite" className="flex min-h-20 items-end">
        <BlurFade className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2 leading-none font-semibold tracking-[-0.03em] text-foreground tabular-nums">
            <span className="text-4xl break-all sm:text-5xl">
              {amount.whole}
              <span className="text-2xl text-muted-foreground sm:text-3xl">{amount.fraction}</span>
            </span>
            <span className="text-base font-medium tracking-normal text-muted-foreground">VNA</span>
          </p>
        </BlurFade>
      </div>
    </BlockCard>
  )
}
