'use client'

import { ChartNoAxesColumnIcon, TriangleAlertIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getLocale, translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { formatCount } from '@/ui/dashboard/format'
import { type NetworkPoint, RANGES, type Range } from '@/ui/dashboard/network-data'
import { StatNumber } from '@/ui/dashboard/stat-number'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/ui/shadcn/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group'

function dayTicks(points: NetworkPoint[]): string[] {
  const seen = new Set<string>()
  return points
    .filter((p) => {
      const day = new Date(p.timestamp).toDateString()
      if (seen.has(day)) return false
      seen.add(day)
      return true
    })
    .map((p) => p.timestamp)
}

function formatTick(value: string, range: Range): string {
  const date = new Date(value)
  return range === '24h'
    ? date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' })
}

export function rangeText(range: Range): string {
  return translate(`dashboard.chart.range.${range}`)
}

function ChartBody({
  series,
  range,
  loading,
  error,
  onRetry,
}: {
  series: NetworkPoint[]
  range: Range
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  const chartConfig = {
    issuedDelta: { label: translate('dashboard.chart.issued'), color: 'var(--chart-1)' },
    verifiedDelta: { label: translate('dashboard.chart.verified'), color: 'var(--chart-3)' },
  } satisfies ChartConfig
  const active = series.some((p) => p.issuedDelta > 0 || p.verifiedDelta > 0)

  if (loading) return <Shimmer className="min-h-[240px] w-full flex-1" />
  if (error)
    return (
      <Empty className="min-h-[240px] border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>{translate('dashboard.chart.error')}</EmptyTitle>
        </EmptyHeader>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {translate('dashboard.retry')}
        </Button>
      </Empty>
    )
  if (!active)
    return (
      <Empty className="min-h-[200px] border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ChartNoAxesColumnIcon />
          </EmptyMedia>
          <EmptyTitle>{translate('dashboard.chart.sparse')}</EmptyTitle>
          <EmptyDescription>{translate('dashboard.chart.sparseDesc')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  return (
    <ChartContainer config={chartConfig} className="aspect-auto min-h-[240px] w-full flex-1">
      <BarChart data={series} accessibilityLayer barCategoryGap={series.length > 60 ? 1 : '18%'}>
        <CartesianGrid vertical={false} />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
          tickMargin={4}
          domain={[0, (max: number) => Math.max(1, max)]}
        />
        <XAxis
          dataKey="timestamp"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          ticks={range === '7d' ? dayTicks(series) : undefined}
          tickFormatter={(value: string) => formatTick(value, range)}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) => {
                const timestamp = payload?.[0]?.payload?.timestamp
                return timestamp
                  ? new Date(String(timestamp)).toLocaleString(getLocale(), {
                      month: 'short',
                      day: 'numeric',
                      hour: RANGES[range].bucketHours < 24 ? '2-digit' : undefined,
                      minute: RANGES[range].bucketHours < 24 ? '2-digit' : undefined,
                    })
                  : ''
              }}
            />
          }
        />
        <Bar dataKey="verifiedDelta" stackId="a" fill="var(--color-verifiedDelta)" radius={[0, 0, 2, 2]} />
        <Bar dataKey="issuedDelta" stackId="a" fill="var(--color-issuedDelta)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export function NetworkActivityChart({
  issued,
  statsError,
  points,
  loading,
  error,
  onRetry,
  range,
  onRangeChange,
  className,
}: {
  issued: number | null
  statsError: boolean
  points: NetworkPoint[]
  loading: boolean
  error: boolean
  onRetry: () => void
  range: Range
  onRangeChange: (range: Range) => void
  className?: string
}) {
  const series = points
  const issuedInRange = series.reduce((sum, p) => sum + p.issuedDelta, 0)
  const verifiedInRange = series.reduce((sum, p) => sum + p.verifiedDelta, 0)
  const label = translate('dataview.dashboard.fields.issuedCredentials')
  const values = { issued: formatCount(issuedInRange), verified: formatCount(verifiedInRange), range: rangeText(range) }

  return (
    <Card className={cn('@container/card bg-linear-to-t from-primary/5 to-card', className)}>
      <CardHeader
        data-stat="issuedCredentials"
        data-stat-value={issued === null ? undefined : formatCount(issued)}
        className="@max-[539px]/card:grid-cols-1!"
      >
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl font-semibold tracking-tight @[540px]/card:text-5xl">
          {issued !== null ? (
            <StatNumber value={issued} className="tracking-tight text-foreground" />
          ) : statsError ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Shimmer className="h-12 w-24" />
          )}
        </CardTitle>
        <CardDescription className="tabular-nums">
          {loading || error ? (
            <span className="invisible">.</span>
          ) : (
            <>
              <span className="hidden @[540px]/card:block">{translate('dashboard.chart.summary', values)}</span>
              <span className="@[540px]/card:hidden">{translate('dashboard.chart.summaryShort', values)}</span>
            </>
          )}
        </CardDescription>
        <CardAction className="col-start-1 row-span-1 row-start-4 justify-self-start pt-2 @[540px]/card:col-start-2 @[540px]/card:row-span-2 @[540px]/card:row-start-1 @[540px]/card:justify-self-end @[540px]/card:pt-0">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => value && onRangeChange(value as Range)}
            variant="outline"
            size="sm"
            aria-label={translate('dashboard.chart.rangeLabel')}
            className="*:data-[slot=toggle-group-item]:px-3!"
          >
            {(Object.keys(RANGES) as Range[]).map((key) => (
              <ToggleGroupItem key={key} value={key} aria-label={rangeText(key)}>
                {key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pt-2 sm:px-4">
        <ChartBody series={series} range={range} loading={loading} error={error} onRetry={onRetry} />
      </CardContent>
    </Card>
  )
}
