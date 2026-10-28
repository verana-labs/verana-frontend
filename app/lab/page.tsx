'use client'

import { BadgeCheck, Boxes, Coins, FileText, type LucideIcon, ShieldCheck, Stamp, Users } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { translate } from '@/i18n/dataview'
import { useDashboardCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { Card, CardContent } from '@/ui/shadcn/card'
import { formatNumber, formatVNAFromUVNA } from '@/util/util'

type Stat = { key: string; label: string; value: string; icon: LucideIcon }

function useStats(): Stat[] {
  const { dashboardData, refetch } = useDashboardCtx()
  const { latestProcessedHeight } = useIndexerEvents()
  useEffect(() => {
    refetch()
  }, [refetch])
  const n = (v: unknown) => formatNumber(String(v ?? ''), true, true)
  const label = (k: string) => translate(`dataview.dashboard.fields.${k}`)
  return [
    { key: 'blockHeight', label: label('blockHeight'), value: n(latestProcessedHeight), icon: Boxes },
    { key: 'ecosystems', label: label('ecosystems'), value: n(dashboardData?.ecosystems), icon: ShieldCheck },
    { key: 'schemas', label: label('schemas'), value: n(dashboardData?.schemas), icon: FileText },
    { key: 'participants', label: label('participants'), value: n(dashboardData?.participants), icon: Users },
    {
      key: 'totalLockedTrustDeposit',
      label: label('totalLockedTrustDeposit'),
      value: formatVNAFromUVNA(String(dashboardData?.totalLockedTrustDeposit ?? '0')),
      icon: Coins,
    },
    {
      key: 'issuedCredentials',
      label: label('issuedCredentials'),
      value: n(dashboardData?.issuedCredentials),
      icon: Stamp,
    },
    {
      key: 'verifiedCredentials',
      label: label('verifiedCredentials'),
      value: n(dashboardData?.verifiedCredentials),
      icon: BadgeCheck,
    },
  ]
}

function VariantA({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {stats.map(({ key, label, value, icon: Icon }) => (
        <Card key={key} className="gap-0 py-0 shadow-none">
          <CardContent className="flex h-full flex-col justify-between gap-1.5 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs leading-tight text-muted-foreground">{label}</span>
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold tracking-tight tabular-nums">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function VariantB({ stats }: { stats: Stat[] }) {
  const [network, ...rest] = stats
  const registry = rest.slice(0, 3)
  const trust = rest.slice(3)
  const Cell = ({ stat }: { stat: Stat }) => (
    <div className="px-5 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{stat.value}</div>
    </div>
  )
  const Group = ({ title, items }: { title: string; items: Stat[] }) => (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <Card className="gap-0 py-0 shadow-none">
        <div className="grid divide-y sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))] sm:divide-x sm:divide-y-0">
          {items.map((s) => (
            <Cell key={s.key} stat={s} />
          ))}
        </div>
      </Card>
    </div>
  )
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_3fr]">
        <Group title="Network" items={[network]} />
        <Group title="Registry" items={registry} />
      </div>
      <Group title="Trust" items={trust} />
    </div>
  )
}

function VariantC({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {stats.map(({ key, label, value, icon: Icon }) => (
        <Card key={key} className="gap-0 py-0 shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex h-full flex-col px-4 py-3">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <div className="mt-2 text-xs leading-tight text-muted-foreground">{label}</div>
            <div className="mt-auto pt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function Block({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  )
}

export default function LabPage() {
  const stats = useStats()
  return (
    <div className="space-y-12 pb-16">
      <h1 className="text-2xl font-semibold">Lab: dashboard stats</h1>
      <Block title="A. Minimal" note="Compact, one line of 7. Label on top, small grey icon, no colour.">
        <VariantA stats={stats} />
      </Block>
      <Block title="B. Grouped strips" note="Stats grouped by meaning (Network, Registry, Trust), one card per group.">
        <VariantB stats={stats} />
      </Block>
      <Block title="C. Brand icon" note="Compact, one line of 7. Small purple icon tile, soft shadow.">
        <VariantC stats={stats} />
      </Block>
    </div>
  )
}
