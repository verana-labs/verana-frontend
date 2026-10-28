import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { quickLinks, stepsGettingStarted } from '@/lib/dashlinks'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import Wallet from '@/wallet/wallet'
import { resolveTranslatable } from '../dataview/types'

function StepAction({ index, walletConnected }: { index: number; walletConnected: boolean }) {
  if (index === 0) return walletConnected ? null : <Wallet size="sm" variant="outline" />
  const link =
    index === 1
      ? walletConnected
        ? { href: '/account', label: translate('gettingstarted.step2.action') }
        : null
      : { href: '/discover', label: translate('discover.title') }
  if (!link) return null
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={link.href}>
        {link.label}
        <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
      </Link>
    </Button>
  )
}

export default function GettingStarted({
  walletConnected = false,
  className,
}: {
  walletConnected?: boolean
  className?: string
}) {
  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <CardTitle>
          <h2>{resolveTranslatable({ key: 'gettingstarted.title' }, translate)}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 @[640px]/card:grid-cols-[1fr_minmax(0,16rem)]">
        <ol className="flex flex-col">
          {stepsGettingStarted.map((step, idx) => {
            const done = idx === 0 && walletConnected
            const last = idx === stepsGettingStarted.length - 1
            return (
              <li key={`step-${idx}`} className="relative flex gap-4 pb-6 last:pb-0">
                {last ? null : (
                  <span aria-hidden="true" className="absolute top-9 bottom-1 left-4 w-px -translate-x-1/2 bg-border" />
                )}
                <span
                  className={cn(
                    'relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    done ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  )}
                >
                  {done ? (
                    <>
                      <CheckIcon aria-hidden="true" className="size-4" />
                      <span className="sr-only">{translate('gettingstarted.done')}</span>
                    </>
                  ) : (
                    idx + 1
                  )}
                </span>
                <div className="flex min-w-0 flex-col items-start gap-2 pt-1">
                  <div>
                    <h3 className="mb-1 font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <StepAction index={idx} walletConnected={walletConnected} />
                </div>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-2">
          <h3 className="px-2 pt-1 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {quickLinks.title}
          </h3>
          {quickLinks.links.map((link, idx) => (
            <Link
              key={`quickLink-${idx}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-(--duration-base) hover:bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-card text-primary shadow-card">
                <FontAwesomeIcon icon={link.icon ?? '0'} aria-hidden="true" className="text-xs" />
              </span>
              <span className="flex-1 font-medium">{link.label}</span>
              <ArrowUpRightIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform duration-(--duration-base) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
