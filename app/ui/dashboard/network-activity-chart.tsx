'use client'

import { useReducedMotion } from 'framer-motion'
import { ChartNoAxesColumnIcon, TriangleAlertIcon } from 'lucide-react'
import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { getLocale, translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import {
  AreaGradient,
  CHART_ACTIVE_DOT,
  CHART_EVENT_LINE,
  CHART_GRID,
  CHART_LINE_CURSOR,
  CHART_STROKE_WIDTH,
  chartGradientId,
} from '@/ui/common/chart-craft'
import { TipCard, TipRow } from '@/ui/common/chart-tooltip-card'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import { KpiStat } from '@/ui/common/kpi-stat'
import { SegmentedControl } from '@/ui/common/segmented-control'
import { formatCount, periodDelta } from '@/ui/dashboard/format'
import { GhostArea } from '@/ui/dashboard/ghost-visuals'
import { type NetworkPoint, type PeriodTotals, RANGES, type Range } from '@/ui/dashboard/network-data'
import { StatNumber } from '@/ui/dashboard/stat-number'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/ui/shadcn/chart'

const ISSUED_COLOR = 'var(--chart-1)'
const VERIFIED_COLOR = 'var(--chart-3)'
const MAX_MARKERS = 6

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

function formatBucket(timestamp: string, range: Range): string {
  const hourly = RANGES[range].bucketHours < 24
  return new Date(timestamp).toLocaleString(getLocale(), {
    month: 'short',
    day: 'numeric',
    hour: hourly ? '2-digit' : undefined,
    minute: hourly ? '2-digit' : undefined,
  })
}

export function rangeText(range: Range): string {
  return translate(`dashboard.chart.range.${range}`)
}

function isNetworkPoint(value: unknown): value is NetworkPoint {
  return typeof value === 'object' && value !== null && 'timestamp' in value && 'issuedDelta' in value
}

function joinMarkers(series: NetworkPoint[]): NetworkPoint[] {
  return series
    .filter((p) => p.participantsDelta > 0)
    .sort((a, b) => b.participantsDelta - a.participantsDelta)
    .slice(0, MAX_MARKERS)
}

function MarkerLabel({ viewBox, value }: { viewBox?: unknown; value: string }) {
  if (typeof viewBox !== 'object' || viewBox === null || !('x' in viewBox) || !('y' in viewBox)) return null
  const x = Number(viewBox.x)
  const y = Number(viewBox.y)
  const width = 10 + value.length * 6.5
  return (
    <g transform={`translate(${x - width / 2}, ${y - 20})`}>
      <rect width={width} height={16} rx={8} className="fill-card stroke-border" />
      <text
        x={width / 2}
        y={11.5}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px] font-medium tabular-nums"
      >
        {value}
      </text>
    </g>
  )
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
  const baseId = chartGradientId(useId())
  const reducedMotion = useReducedMotion() ?? false
  const chartConfig = {
    issuedDelta: { label: translate('dashboard.chart.issued'), color: ISSUED_COLOR },
    verifiedDelta: { label: translate('dashboard.chart.verified'), color: VERIFIED_COLOR },
  } satisfies ChartConfig
  const active = series.some((p) => p.issuedDelta > 0 || p.verifiedDelta > 0)

  if (loading) return <Shimmer className="min-h-[240px] w-full flex-1" />
  if (error)
    return (
      <GhostEmpty
        className="min-h-[240px]"
        icon={<TriangleAlertIcon />}
        title={translate('dashboard.chart.error')}
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            {translate('dashboard.retry')}
          </Button>
        }
      >
        <GhostArea />
      </GhostEmpty>
    )
  if (!active)
    return (
      <GhostEmpty
        className="min-h-[240px]"
        icon={<ChartNoAxesColumnIcon />}
        title={translate('dashboard.chart.sparse')}
        description={translate('dashboard.chart.sparseDesc')}
      >
        <GhostArea />
      </GhostEmpty>
    )

  const issuedFill = `${baseId}-issued`
  const verifiedFill = `${baseId}-verified`

  return (
    <ChartContainer config={chartConfig} className="aspect-auto min-h-[240px] w-full flex-1">
      <AreaChart data={series} accessibilityLayer margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <AreaGradient id={issuedFill} color={ISSUED_COLOR} />
          <AreaGradient id={verifiedFill} color={VERIFIED_COLOR} />
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
          tickMargin={4}
          domain={[0, (max: number) => Math.max(1, Math.ceil(max * 1.15))]}
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
        {joinMarkers(series).map((point) => (
          <ReferenceLine
            key={point.timestamp}
            x={point.timestamp}
            {...CHART_EVENT_LINE}
            label={<MarkerLabel value={`+${formatCount(point.participantsDelta)}`} />}
          />
        ))}
        <ChartTooltip
          cursor={CHART_LINE_CURSOR}
          content={({ active: hovered, payload }) => {
            const point: unknown = payload?.[0]?.payload
            if (!hovered || !isNetworkPoint(point)) return null
            return (
              <TipCard title={formatBucket(point.timestamp, range)}>
                <TipRow
                  label={translate('dashboard.chart.issued')}
                  value={formatCount(point.issuedDelta)}
                  color={ISSUED_COLOR}
                />
                <TipRow
                  label={translate('dashboard.chart.verified')}
                  value={formatCount(point.verifiedDelta)}
                  color={VERIFIED_COLOR}
                />
                {point.participantsDelta > 0 ? (
                  <TipRow
                    label={translate('dataview.dashboard.fields.participants')}
                    value={`+${formatCount(point.participantsDelta)}`}
                    color="var(--tooltip-muted)"
                    shape="dash"
                  />
                ) : null}
              </TipCard>
            )
          }}
        />
        <Area
          dataKey="verifiedDelta"
          type="monotone"
          fill={`url(#${verifiedFill})`}
          stroke={VERIFIED_COLOR}
          strokeWidth={CHART_STROKE_WIDTH}
          activeDot={CHART_ACTIVE_DOT}
          isAnimationActive={!reducedMotion}
        />
        <Area
          dataKey="issuedDelta"
          type="monotone"
          fill={`url(#${issuedFill})`}
          stroke={ISSUED_COLOR}
          strokeWidth={CHART_STROKE_WIDTH}
          activeDot={CHART_ACTIVE_DOT}
          isAnimationActive={!reducedMotion}
        />
      </AreaChart>
    </ChartContainer>
  )
}

function Swatch({ color }: { color: string | null }) {
  return color ? (
    <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
  ) : (
    <span aria-hidden="true" className="h-0 w-3 shrink-0 border-t-[1.5px] border-dashed border-muted-foreground" />
  )
}

function PeriodStrip({
  current,
  previous,
  range,
}: {
  current: PeriodTotals
  previous: PeriodTotals | null
  range: Range
}) {
  const items = [
    { key: 'issued', label: translate('dashboard.chart.issued'), color: ISSUED_COLOR },
    { key: 'verified', label: translate('dashboard.chart.verified'), color: VERIFIED_COLOR },
    { key: 'participants', label: translate('dataview.dashboard.fields.participants'), color: null },
  ] as const
  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-lg bg-muted/40 py-2.5 ring-1 ring-foreground/5">
      {items.map((item) => (
        <KpiStat
          key={item.key}
          size="sm"
          className="px-3 sm:px-4"
          label={
            <span className="flex items-center gap-1.5">
              <Swatch color={item.color} />
              <span className="truncate">{item.label}</span>
            </span>
          }
          value={`+${formatCount(current[item.key])}`}
          delta={
            previous
              ? periodDelta(current[item.key], previous[item.key], translate(`dashboard.chart.vsPrevious.${range}`))
              : null
          }
        />
      ))}
    </div>
  )
}

export function NetworkActivityChart({
  issued,
  statsError,
  points,
  previous,
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
  previous: PeriodTotals | null
  loading: boolean
  error: boolean
  onRetry: () => void
  range: Range
  onRangeChange: (range: Range) => void
  className?: string
}) {
  const series = points
  const current: PeriodTotals = {
    issued: series.reduce((sum, p) => sum + p.issuedDelta, 0),
    verified: series.reduce((sum, p) => sum + p.verifiedDelta, 0),
    participants: series.reduce((sum, p) => sum + p.participantsDelta, 0),
  }
  const label = translate('dataview.dashboard.fields.issuedCredentials')

  return (
    <Card className={cn('@container/card bg-linear-to-t from-primary/5 to-card', className)}>
      <CardHeader
        data-stat="issuedCredentials"
        data-stat-value={issued === null ? undefined : formatCount(issued)}
        className="@max-[539px]/card:grid-cols-1!"
      >
        <CardDescription className="text-[13px] font-medium">{label}</CardDescription>
        <CardTitle className="text-4xl leading-tight font-semibold tracking-[-0.03em] tabular-nums @[540px]/card:text-5xl">
          {issued !== null ? (
            <StatNumber value={issued} className="tracking-[-0.03em] text-foreground" />
          ) : statsError ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Shimmer className="h-12 w-24" />
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          {translate('dashboard.chart.summary', { range: rangeText(range) })}
        </CardDescription>
        <CardAction className="col-start-1 row-span-1 row-start-4 justify-self-start pt-2 @[540px]/card:col-start-2 @[540px]/card:row-span-2 @[540px]/card:row-start-1 @[540px]/card:justify-self-end @[540px]/card:pt-0">
          <SegmentedControl
            items={(Object.keys(RANGES) as Range[]).map((key) => ({
              value: key,
              label: key,
              ariaLabel: rangeText(key),
            }))}
            value={range}
            onValueChange={onRangeChange}
            label={translate('dashboard.chart.rangeLabel')}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 px-2 sm:px-4">
        {loading ? (
          <Shimmer className="h-[62px] w-full rounded-lg" />
        ) : error ? null : (
          <PeriodStrip current={current} previous={previous} range={range} />
        )}
        <ChartBody series={series} range={range} loading={loading} error={error} onRetry={onRetry} />
      </CardContent>
    </Card>
  )
}
