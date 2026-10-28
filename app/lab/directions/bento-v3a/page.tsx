'use client'

import {
  ActivityIcon,
  BadgeCheckIcon,
  FileJson2Icon,
  LockIcon,
  MoonIcon,
  NetworkIcon,
  RadioTowerIcon,
  SunIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { type Range, useLabDashboard, useNetworkSeries } from '@/lab/dashboard/data'
import { type CountTile, CountTiles } from '@/lab/directions/bento-v3a/count-tiles'
import { EcosystemsCard } from '@/lab/directions/bento-v3a/ecosystems-card'
import { rolesOf, useGlobalSnapshot, useLatestSchemas } from '@/lab/directions/bento-v3a/network-extras'
import { SchemasCard } from '@/lab/directions/bento-v3a/schemas-card'
import { AnimatedListDemo, activityFrom } from '@/lab/directions/bento-v3a/ui/animated-list-demo'
import { ChartAreaInteractive } from '@/lab/directions/bento-v3a/ui/chart-area-interactive'
import { ChartBarMixed } from '@/lab/directions/bento-v3a/ui/chart-bar-mixed'
import { WalletCard } from '@/lab/directions/bento-v3a/wallet-card'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { SidebarTrigger } from '@/ui/shadcn/sidebar'
import { AppShell } from '@/ui/shell/app-shell'

const PAGE_CSS = `
.bento-v3a {
  --background: #ffffff;
  --card: #ffffff;
  --color-background: var(--background);
  --color-border: var(--border);
}
.dark .bento-v3a {
  --background: #13111a;
  --card: #13111a;
  --muted: #1f1c29;
  --border: rgb(255 255 255 / 0.08);
  --color-background: var(--background);
  --color-border: var(--border);
}
@keyframes shimmer-slide {
  to { transform: translate(calc(100cqw - 100%), 0); }
}
@keyframes spin-around {
  0% { transform: translateZ(0) rotate(0); }
  15%, 35% { transform: translateZ(0) rotate(90deg); }
  65%, 85% { transform: translateZ(0) rotate(270deg); }
  100% { transform: translateZ(0) rotate(360deg); }
}
`

const RANGE_TEXT: Record<Range, string> = {
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 3 months',
}

const WEEK_MS = 7 * 24 * 3_600_000

export default function BentoV3aPage() {
  const [range, setRange] = useState<Range>('7d')
  const { stats, ecosystems, ecosystemsLoading, pager } = useLabDashboard()
  const { points, loading } = useNetworkSeries(range)
  const snapshot = useGlobalSnapshot()
  const schemas = useLatestSchemas(12)
  const chain = useVeranaChain()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const activity = activityFrom(points, schemas ?? [])

  const first = points[0]
  const last = points.at(-1)
  const joined = first && last ? last.participants - first.participants : null
  const newEcosystems = first && last ? last.ecosystems - first.ecosystems : 0
  const newSchemas = (schemas ?? []).filter((s) => Date.now() - new Date(s.created).getTime() < WEEK_MS).length
  const issued = snapshot?.issued ?? stats.issuedCredentials ?? null
  const verified = snapshot?.verified ?? stats.verifiedCredentials ?? null
  const rate = issued && verified !== null ? (verified / issued) * 100 : 0
  const lockedVna = stats.totalLockedTrustDeposit == null ? null : Number(stats.totalLockedTrustDeposit) / 1_000_000
  const slashEvents = snapshot ? snapshot.network_slash_events + snapshot.ecosystem_slash_events : null

  const tiles: CountTile[] = [
    {
      name: 'Ecosystems',
      description:
        newEcosystems > 0 ? `Trust registries, +${newEcosystems} this period` : 'Trust registries publishing schemas',
      href: '/ecosystems',
      cta: 'Browse ecosystems',
      Icon: NetworkIcon,
      value: snapshot?.active_ecosystems ?? stats.ecosystems ?? null,
    },
    {
      name: 'Schemas',
      description:
        newSchemas > 0
          ? `Credential types you can issue, ${newSchemas} new this week`
          : 'Credential types you can issue',
      href: '/discover',
      cta: 'Discover schemas',
      Icon: FileJson2Icon,
      value: snapshot?.active_schemas ?? stats.schemas ?? null,
    },
    {
      name: 'Verified',
      description: `Checks made by verifiers, ${rate.toFixed(0)}% of ${(issued ?? 0).toLocaleString('en-US')} issued`,
      href: '/participants',
      cta: 'See verifiers',
      Icon: BadgeCheckIcon,
      value: verified,
    },
    {
      name: 'Trust deposit',
      description: `VNA locked to back participant roles, ${slashEvents ?? 0} slashed`,
      href: '/account',
      cta: 'Open account',
      Icon: LockIcon,
      value: lockedVna,
      decimals: lockedVna !== null && lockedVna > 0 && lockedVna < 10 ? 2 : 0,
    },
  ]

  return (
    <AppShell>
      <style>{PAGE_CSS}</style>
      <div className="bento-v3a @container/page flex flex-1 flex-col rounded-[inherit] px-4 pt-5 pb-8 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 @5xl/page:gap-5">
          <header className="flex items-end justify-between gap-4 pb-2">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <SidebarTrigger className="-ml-1.5" />
                <Badge variant="outline" className="gap-1.5 font-mono">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {stats.blockHeight ? `block ${stats.blockHeight.toLocaleString('en-US')}` : 'connecting'}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-[#5b21d4] via-primary to-[#c084fc] bg-clip-text text-transparent dark:from-[#9f7aea] dark:via-[#c4b5fd] dark:to-[#f0abfc]">
                  Verana
                </span>
              </h1>
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </Button>
          </header>

          <section className="grid grid-cols-1 gap-4 @xl/page:grid-cols-12 @5xl/page:gap-5">
            <ChartAreaInteractive
              issued={issued}
              points={points}
              loading={loading}
              range={range}
              onRangeChange={setRange}
              className="@xl/page:col-span-12 @5xl/page:col-span-8"
            />
            <div className="grid gap-4 @xl/page:col-span-12 @xl/page:grid-cols-2 @5xl/page:col-span-4 @5xl/page:grid-cols-1 @5xl/page:grid-rows-[1fr_auto] @5xl/page:gap-5">
              <ChartBarMixed
                roles={rolesOf(snapshot)}
                total={snapshot?.participants ?? null}
                joined={joined ?? 0}
                period={RANGE_TEXT[range]}
              />
              <WalletCard />
            </div>
          </section>

          <CountTiles tiles={tiles} className="@5xl/page:gap-5" />

          <section className="grid grid-cols-1 gap-4 @xl/page:grid-cols-12 @5xl/page:gap-5">
            <EcosystemsCard
              ecosystems={ecosystems}
              loading={ecosystemsLoading}
              pager={pager}
              className="@xl/page:col-span-12 @5xl/page:col-span-8"
            />
            <Card className="h-[22rem] gap-0 @xl/page:col-span-12 @xl/page:h-[26rem] @5xl/page:col-span-4 @5xl/page:h-auto @5xl/page:min-h-[26rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon className="size-4 text-primary" />
                  Live activity
                </CardTitle>
                <CardDescription>
                  {activity.length ? `Replaying the ${RANGE_TEXT[range]}` : `Quiet in the ${RANGE_TEXT[range]}`}
                </CardDescription>
                <CardAction>
                  <RadioTowerIcon className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <div className="relative min-h-0 flex-1">
                <AnimatedListDemo
                  key={`${range}-${activity.length}`}
                  items={activity}
                  className="absolute inset-0 h-auto px-4 pt-4 [mask-image:linear-gradient(to_top,transparent_0%,#000_35%)]"
                />
              </div>
            </Card>
            <SchemasCard schemas={schemas} ecosystems={ecosystems} className="@xl/page:col-span-12" />
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {chain.chain_id}
            </span>
            <nav className="flex flex-wrap gap-4">
              <Link href="/discover" className="hover:text-foreground">
                Discover
              </Link>
              <Link href="/ecosystems" className="hover:text-foreground">
                Ecosystems
              </Link>
              <Link href="/participants" className="hover:text-foreground">
                Participants
              </Link>
              <Link href="/account" className="hover:text-foreground">
                Account
              </Link>
              <Link href="/settings" className="hover:text-foreground">
                Settings
              </Link>
            </nav>
          </footer>
        </div>
      </div>
    </AppShell>
  )
}
