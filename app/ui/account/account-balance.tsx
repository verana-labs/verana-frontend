'use client'

import { PlusIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { formatVNAFromUVNA } from '@/util/util'

const DECIMAL_SEPARATOR = new Intl.NumberFormat(undefined).format(1.5).charAt(1)

function splitAmount(balance: string | null) {
  const formatted = formatVNAFromUVNA(balance).replace(/\s*VNA$/, '')
  if (!formatted) return null
  const index = formatted.lastIndexOf(DECIMAL_SEPARATOR)
  return index < 0
    ? { whole: formatted, fraction: '' }
    : { whole: formatted.slice(0, index), fraction: formatted.slice(index) }
}

export function AccountBalance({ balance, onGetVNA }: { balance: string | null; onGetVNA?: () => void }) {
  const amount = splitAmount(balance)

  return (
    <Card className="h-full shadow-card [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">
          <h2>{translate('dataview.account.fields.balance.label')}</h2>
        </CardTitle>
        <CardDescription>{translate('dataview.account.fields.balance.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex min-h-14 items-end" aria-live="polite" aria-busy={amount == null}>
        {amount ? (
          <BlurFade>
            <p className="flex flex-wrap items-baseline gap-x-2 leading-none font-semibold tracking-tight text-foreground tabular-nums">
              <span className="text-4xl break-all sm:text-5xl">
                {amount.whole}
                <span className="text-2xl text-muted-foreground sm:text-3xl">{amount.fraction}</span>
              </span>
              <span className="text-base font-medium tracking-normal text-muted-foreground">VNA</span>
            </p>
          </BlurFade>
        ) : (
          <Shimmer className="h-12 w-48" />
        )}
      </CardContent>
      {onGetVNA ? (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={onGetVNA} className="bg-card">
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            {translate('dataview.account.actions.getVNA.label')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
