'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { VERANA_REST_ENDPOINT_STATS } from '@/config/env'
import { translate } from '@/i18n/dataview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/ui/shadcn/chart'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group'

type Range = '24h' | '7d' | '30d' | '90d'
type Metric = 'credentials' | 'participants'
type Point = { timestamp: string; issued: number; verified: number; participants: number }

const RANGES: Record<Range, { hours: number; granularity: 'HOUR' | 'DAY' }> = {
  '24h': { hours: 24, granularity: 'HOUR' },
  '7d': { hours: 24 * 7, granularity: 'HOUR' },
  '30d': { hours: 24 * 30, granularity: 'DAY' },
  '90d': { hours: 24 * 90, granularity: 'DAY' },
}

const chartConfig = {
  issued: { label: translate('dataview.dashboard.fields.issuedCredentials'), color: 'var(--chart-1)' },
  verified: { label: translate('dataview.dashboard.fields.verifiedCredentials'), color: 'var(--chart-3)' },
  participants: { label: translate('dataview.dashboard.fields.participants'), color: 'var(--chart-1)' },
} satisfies ChartConfig

type Bucket = {
  timestamp: string
  cumulative_issued: number
  cumulative_verified: number
  cumulative_participants: number
}

function useActivity(range: Range): { points: Point[]; loading: boolean } {
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!VERANA_REST_ENDPOINT_STATS) return
    const { hours, granularity } = RANGES[range]
    const until = new Date()
    const from = new Date(until.getTime() - hours * 3_600_000)
    const params = new URLSearchParams({
      entity_type: 'GLOBAL',
      granularity,
      timestamp_from: from.toISOString(),
      timestamp_until: until.toISOString(),
      result_type: 'BUCKETS',
    })
    const controller = new AbortController()
    setLoading(true)
    fetch(`${VERANA_REST_ENDPOINT_STATS}/stats?${params}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ buckets?: Bucket[] }>)
      .then(({ buckets = [] }) => {
        setPoints(
          buckets.map((b) => ({
            timestamp: b.timestamp,
            issued: b.cumulative_issued,
            verified: b.cumulative_verified,
            participants: b.cumulative_participants,
          }))
        )
        setLoading(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [range])
  return { points, loading }
}

function formatTick(value: string, range: Range): string {
  const date = new Date(value)
  return range === '24h'
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function firstOfEachDay(points: Point[]): string[] {
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

export function ActivityChart() {
  const [range, setRange] = useState<Range>('7d')
  const [metric, setMetric] = useState<Metric>('credentials')
  const { points, loading } = useActivity(range)

  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle>Network activity</CardTitle>
          <CardDescription>
            {metric === 'credentials' ? 'Credentials issued and verified' : 'Participants'} over time, network wide
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleGroup
            type="single"
            value={metric}
            onValueChange={(value) => value && setMetric(value as Metric)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="credentials">Credentials</ToggleGroupItem>
            <ToggleGroupItem value="participants">Participants</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => value && setRange(value as Range)}
            variant="outline"
            size="sm"
          >
            {(Object.keys(RANGES) as Range[]).map((key) => (
              <ToggleGroupItem key={key} value={key}>
                {key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading && points.length === 0 ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={points} margin={{ left: 0, right: 8 }}>
              <defs>
                {(['issued', 'verified', 'participants'] as const).map((key) => (
                  <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                ticks={range === '7d' ? firstOfEachDay(points) : undefined}
                tickFormatter={(value: string) => formatTick(value, range)}
              />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => new Date(String(value)).toLocaleString()}
                  />
                }
              />
              {metric === 'credentials' ? (
                <>
                  <Area dataKey="verified" type="monotone" fill="url(#fill-verified)" stroke="var(--color-verified)" />
                  <Area dataKey="issued" type="monotone" fill="url(#fill-issued)" stroke="var(--color-issued)" />
                </>
              ) : (
                <Area
                  dataKey="participants"
                  type="monotone"
                  fill="url(#fill-participants)"
                  stroke="var(--color-participants)"
                />
              )}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
