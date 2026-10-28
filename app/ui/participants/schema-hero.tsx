'use client'

import { ArrowLeftIcon, FileJson2Icon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import ServiceIdentity from '@/ui/common/service-identity'
import { getModePillClass } from '@/ui/datatable/columnslist/cs'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Shimmer } from '@/ui/motion/shimmer'
import { Badge } from '@/ui/shadcn/badge'
import { Card } from '@/ui/shadcn/card'

export type SchemaStatus = 'ACTIVE' | 'ARCHIVED'

type SchemaHeroProps = {
  title: string
  description?: string
  id: string | number
  status?: SchemaStatus
  issuerOnboardingMode?: string | number
  verifierOnboardingMode?: string | number
  holderOnboardingMode?: string | number
  ecosystem?: { id: string; did: string } | null
  ecosystemPending?: boolean
  action?: ReactNode
  compact?: boolean
}

const tr = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

function EcosystemBackLink({
  ecosystem,
  pending,
}: {
  ecosystem?: { id: string; did: string } | null
  pending: boolean
}) {
  if (ecosystem) {
    return (
      <Link
        href={`/ecosystems/${ecosystem.id}`}
        className="group inline-flex max-w-full items-center gap-2 rounded-md py-1 pe-2 text-sm text-muted-foreground transition-colors duration-(--duration-base) hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-(--duration-base) ease-standard group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
        />
        <ServiceIdentity did={ecosystem.did} showFlag={false} showTrust={false} className="min-w-0" />
      </Link>
    )
  }
  if (pending) return <Shimmer className="h-5 w-44" />
  return null
}

const FACT_INLINE = 'flex items-center gap-1.5 md:block'
const FACT_VALUE_INLINE = 'md:mt-1.5'

function FactLabel({ label, shortLabel, compact }: { label: string; shortLabel: string; compact: boolean }) {
  if (!compact) return <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
  return (
    <dt className="text-xs font-medium text-muted-foreground">
      <span className="md:hidden">{shortLabel}</span>
      <span className="hidden md:inline">{label}</span>
    </dt>
  )
}

function ModeFact({
  label,
  shortLabel,
  value,
  suffix,
  compact,
}: {
  label: string
  shortLabel: string
  value?: string | number
  suffix: string
  compact: boolean
}) {
  const raw = value !== undefined && value !== null ? String(value) : ''
  if (!raw.trim()) return null
  return (
    <div className={cn('min-w-0', compact && FACT_INLINE)}>
      <FactLabel label={label} shortLabel={shortLabel} compact={compact} />
      <dd className={compact ? FACT_VALUE_INLINE : 'mt-1.5'}>
        <Badge
          className={cn('h-auto rounded-full px-2 py-0.5 font-medium whitespace-normal', getModePillClass(raw, suffix))}
        >
          {raw}
        </Badge>
      </dd>
    </div>
  )
}

export function SchemaHero({
  title,
  description,
  id,
  status,
  issuerOnboardingMode,
  verifierOnboardingMode,
  holderOnboardingMode,
  ecosystem,
  ecosystemPending = false,
  action,
  compact = false,
}: SchemaHeroProps) {
  return (
    <BlurFade className="mb-6 flex flex-col gap-3">
      <div className="flex min-h-7 items-center">
        <EcosystemBackLink ecosystem={ecosystem} pending={ecosystemPending} />
      </div>
      <Card className="gap-0 py-0">
        <div className={cn('flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start', compact && 'sm:py-5')}>
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 sm:flex">
              <FileJson2Icon aria-hidden="true" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1
                  className={cn(
                    'font-semibold tracking-tight text-foreground break-words',
                    compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                  )}
                >
                  {title}
                </h1>
                {status ? (
                  <Badge
                    className={cn(
                      'gap-1.5 rounded-full',
                      status === 'ARCHIVED' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                    )}
                  >
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                    {status}
                  </Badge>
                ) : null}
              </div>
              {description ? (
                <p
                  className={cn(
                    'mt-2 max-w-3xl text-sm text-muted-foreground text-pretty',
                    compact ? 'line-clamp-2 sm:line-clamp-none' : 'sm:text-base'
                  )}
                >
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0 *:w-full lg:*:w-auto">{action}</div> : null}
        </div>
        <dl
          className={cn(
            'border-t bg-muted/40 px-5 py-4 sm:px-6 md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-4',
            compact ? 'flex flex-wrap gap-x-4 gap-y-2 py-3 md:py-4' : 'grid grid-cols-2 gap-x-6 gap-y-4'
          )}
        >
          <div className={cn('min-w-0', compact && FACT_INLINE)}>
            <dt className="text-xs font-medium text-muted-foreground">{tr('dataview.cs.fields.id', 'ID')}</dt>
            <dd
              className={cn('font-mono text-sm text-foreground tabular-nums', compact ? FACT_VALUE_INLINE : 'mt-1.5')}
            >
              {id}
            </dd>
          </div>
          <ModeFact
            label={tr('dataview.cs.fields.issuerOnboardingMode', 'Issuer Onboarding Mode')}
            shortLabel={tr('participantcard.role.singular.issuer', 'Issuer')}
            value={issuerOnboardingMode}
            suffix="_ISSUER"
            compact={compact}
          />
          <ModeFact
            label={tr('dataview.cs.fields.verifierOnboardingMode', 'Verifier Onboarding Mode')}
            shortLabel={tr('participantcard.role.singular.verifier', 'Verifier')}
            value={verifierOnboardingMode}
            suffix="_VERIFIER"
            compact={compact}
          />
          <ModeFact
            label={tr('dataview.cs.fields.holderOnboardingMode', 'Holder Onboarding Mode')}
            shortLabel={tr('participantcard.role.singular.holder', 'Holder')}
            value={holderOnboardingMode}
            suffix="_HOLDER"
            compact={compact}
          />
        </dl>
      </Card>
    </BlurFade>
  )
}

export function SchemaHeroSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-3" aria-busy="true">
      <Shimmer className="h-5 w-44" />
      <Card className="gap-0 py-0">
        <div className="flex gap-4 p-5 sm:p-6">
          <Shimmer className="hidden size-12 rounded-xl sm:block" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-8 w-2/5" />
            <Shimmer className="h-4 w-4/5" />
            <Shimmer className="h-4 w-3/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t px-5 py-4 sm:px-6 md:grid-cols-4">
          {[0, 1, 2, 3].map((cell) => (
            <div key={cell} className="space-y-2">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-5 w-24" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
