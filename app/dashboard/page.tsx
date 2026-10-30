'use client'

import { useChain } from '@cosmos-kit/react'
import { BadgeCheckIcon, FileJson2Icon, LockIcon, NetworkIcon, TriangleAlertIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useDashboardCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import DashboardFooter from '@/ui/common/dashboard-footer'
import FeaturedServices from '@/ui/common/featured-services'
import GettingStarted from '@/ui/common/getting-started'
import { type CountTile, CountTiles } from '@/ui/dashboard/count-tiles'
import { DashboardHeader } from '@/ui/dashboard/dashboard-header'
import { EcosystemsCard } from '@/ui/dashboard/ecosystems-card'
import { formatCompact, formatCount, periodDelta } from '@/ui/dashboard/format'
import { LiveActivity } from '@/ui/dashboard/live-activity'
import { NetworkActivityChart, rangeText } from '@/ui/dashboard/network-activity-chart'
import { type Range, rolesOf, useLatestSchemas, useNetworkSeries, useTopEcosystems } from '@/ui/dashboard/network-data'
import { ParticipantsByRole } from '@/ui/dashboard/participants-by-role'
import { SchemasCard } from '@/ui/dashboard/schemas-card'
import { WalletCard } from '@/ui/dashboard/wallet-card'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Alert, AlertAction, AlertDescription } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'
import { formatVNAFromUVNA } from '@/util/util'

function vnaFromUvna(uvna: string): number {
  return Number(uvna) / 1_000_000
}

function formatVna(vna: number): string {
  return formatCompact(vna, 2)
}

export default function Page() {
  const veranaChain = useVeranaChain()
  const { isWalletConnected } = useChain(veranaChain.chain_name)
  const { memberships, actingCorporation, loading: corporationsLoading, error: discoveryError } = useUserCorporation()
  const noCorporation = isWalletConnected && !corporationsLoading && !discoveryError && memberships.length === 0

  const { latestProcessedHeight } = useIndexerEvents()
  const { dashboardData, refetch } = useDashboardCtx()
  const ecosystems = useTopEcosystems()
  const schemas = useLatestSchemas(12)
  const [range, setRange] = useState<Range>('7d')
  const series = useNetworkSeries(range)
  const [statsSettled, setStatsSettled] = useState(false)

  const loadStats = useCallback(() => {
    setStatsSettled(false)
    void refetch().finally(() => setStatsSettled(true))
  }, [refetch])

  useEffect(loadStats, [loadStats])

  const stats = dashboardData ?? {}
  const statsError = statsSettled && !dashboardData

  const issued = stats.issuedCredentials ?? null
  const verified = stats.verifiedCredentials ?? null
  const locked = stats.totalLockedTrustDeposit ?? null
  const lockedDisplay = locked === null ? null : formatVNAFromUVNA(locked)
  const rate = issued && verified !== null ? (verified / issued) * 100 : 0
  const points = useMemo(() => series.data?.points ?? [], [series.data])
  const previous = series.data?.previous ?? null
  const roles = useMemo(() => rolesOf(dashboardData?.roles), [dashboardData?.roles])
  const joined = points.reduce((sum, p) => sum + p.participantsDelta, 0)

  const tiles: CountTile[] = [
    {
      stat: 'ecosystems',
      name: translate('dataview.dashboard.fields.ecosystems'),
      description: translate('dashboard.tiles.ecosystems.desc'),
      Icon: NetworkIcon,
      value: stats.ecosystems ?? null,
      display: stats.ecosystems == null ? null : formatCount(stats.ecosystems),
      href: '/discover',
      cta: translate('dashboard.tiles.ecosystems.cta'),
      error: statsError,
    },
    {
      stat: 'schemas',
      name: translate('dataview.dashboard.fields.schemas'),
      description: translate('dashboard.tiles.schemas.desc'),
      Icon: FileJson2Icon,
      value: stats.schemas ?? null,
      display: stats.schemas == null ? null : formatCount(stats.schemas),
      error: statsError,
    },
    {
      stat: 'verifiedCredentials',
      name: translate('dataview.dashboard.fields.verifiedCredentials'),
      description: translate('dashboard.tiles.verified.desc', {
        rate: rate.toFixed(0),
        issued: formatCount(issued ?? 0),
      }),
      Icon: BadgeCheckIcon,
      value: verified,
      display: verified === null ? null : formatCount(verified),
      error: statsError,
    },
    {
      stat: 'totalLockedTrustDeposit',
      name: translate('dataview.dashboard.fields.totalLockedTrustDeposit'),
      description: translate('dashboard.tiles.deposit.desc', { amount: lockedDisplay ?? '—' }),
      Icon: LockIcon,
      value: locked === null ? null : vnaFromUvna(locked),
      display: lockedDisplay,
      format: formatVna,
      href: isWalletConnected ? '/account' : undefined,
      cta: translate('dashboard.tiles.deposit.cta'),
      error: statsError,
    },
  ]

  return (
    <div className="@container/page flex flex-col gap-4 @5xl/page:gap-5">
      <DashboardHeader blockHeight={latestProcessedHeight || null} />

      {statsError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{translate('dashboard.stats.error')}</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={loadStats}>
              {translate('dashboard.retry')}
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <BlurFade delay={0.05}>
        <section className="grid grid-cols-1 gap-4 @xl/page:grid-cols-12 @5xl/page:gap-5">
          <NetworkActivityChart
            issued={issued}
            statsError={statsError}
            points={points}
            previous={previous}
            loading={series.loading}
            error={series.error}
            onRetry={series.retry}
            range={range}
            onRangeChange={setRange}
            className="@xl/page:col-span-12 @5xl/page:col-span-8"
          />
          <div className="grid gap-4 @xl/page:col-span-12 @xl/page:grid-cols-2 @5xl/page:col-span-4 @5xl/page:grid-cols-1 @5xl/page:grid-rows-[1fr_auto] @5xl/page:gap-5">
            <ParticipantsByRole
              roles={roles}
              rolesError={statsError}
              onRetry={loadStats}
              total={stats.participants ?? null}
              joined={joined}
              joinedDelta={
                previous
                  ? periodDelta(joined, previous.participants, translate(`dashboard.chart.vsPrevious.${range}`))
                  : null
              }
              period={rangeText(range)}
            />
            <WalletCard noCorporation={noCorporation} className="justify-center @5xl/page:justify-between" />
          </div>
        </section>
      </BlurFade>

      <CountTiles tiles={tiles} />

      <section className="grid grid-cols-1 gap-4 @xl/page:grid-cols-12 @5xl/page:gap-5">
        <EcosystemsCard
          ecosystems={ecosystems.data}
          total={stats.ecosystems ?? null}
          loading={ecosystems.loading}
          error={ecosystems.error}
          onRetry={ecosystems.retry}
          className="@xl/page:col-span-12 @5xl/page:col-span-8"
        />
        <LiveActivity className="@xl/page:col-span-12 @5xl/page:col-span-4 @5xl/page:h-0 @5xl/page:min-h-full" />
      </section>

      <section className="grid grid-cols-1 gap-4 @xl/page:grid-cols-12 @5xl/page:gap-5">
        <GettingStarted walletConnected={isWalletConnected} className="@xl/page:col-span-12 @5xl/page:col-span-8" />
        <FeaturedServices
          isWalletConnected={isWalletConnected}
          hasCorporation={actingCorporation !== null || (corporationsLoading || discoveryError ? undefined : false)}
          className="@xl/page:col-span-12 @5xl/page:col-span-4"
        />
      </section>

      <SchemasCard
        schemas={schemas.data}
        total={stats.schemas ?? null}
        error={schemas.error}
        onRetry={schemas.retry}
        ecosystems={ecosystems.data}
      />

      <DashboardFooter className="mt-4" />
    </div>
  )
}
