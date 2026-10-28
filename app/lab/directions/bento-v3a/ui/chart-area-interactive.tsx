'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { type NetworkPoint, RANGES, type Range } from '@/lab/dashboard/data'
import { NumberTicker } from '@/lab/directions/bento-v3a/ui/number-ticker'
import { cn } from '@/lib/utils'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/ui/shadcn/chart'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group'

const chartConfig = {
  issuedDelta: {
    label: 'Issued',
    color: 'var(--chart-1)',
  },
  verifiedDelta: {
    label: 'Verified',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const RANGE_TEXT: Record<Range, string> = {
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 3 months',
}

function formatTick(value: string, range: Range): string {
  const date = new Date(value)
  return range === '24h'
    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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

export function ChartAreaInteractive({
  issued,
  points,
  loading,
  range,
  onRangeChange,
  className,
}: {
  issued: number | null | undefined
  points: NetworkPoint[]
  loading: boolean
  range: Range
  onRangeChange: (range: Range) => void
  className?: string
}) {
  const series = points.slice(1)
  const issuedInRange = series.reduce((sum, p) => sum + p.issuedDelta, 0)
  const verifiedInRange = series.reduce((sum, p) => sum + p.verifiedDelta, 0)

  return (
    <Card className={cn('@container/card bg-gradient-to-t from-primary/5 to-card', className)}>
      <CardHeader className="@max-[539px]/card:grid-cols-1!">
        <CardDescription>Credentials issued</CardDescription>
        <CardTitle className="text-4xl font-semibold tracking-tight tabular-nums @[540px]/card:text-5xl">
          {issued === null || issued === undefined ? (
            <Skeleton className="h-12 w-24" />
          ) : (
            <NumberTicker value={issued} className="tracking-tight text-foreground dark:text-foreground" />
          )}
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            +{issuedInRange.toLocaleString('en-US')} issued and +{verifiedInRange.toLocaleString('en-US')} verified in
            the {RANGE_TEXT[range]}
          </span>
          <span className="@[540px]/card:hidden">
            +{issuedInRange.toLocaleString('en-US')} issued, {RANGE_TEXT[range]}
          </span>
        </CardDescription>
        <CardAction className="col-start-1 row-span-1 row-start-4 justify-self-start pt-2 @[540px]/card:col-start-2 @[540px]/card:row-span-2 @[540px]/card:row-start-1 @[540px]/card:justify-self-end @[540px]/card:pt-0">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => value && onRangeChange(value as Range)}
            variant="outline"
            size="sm"
            className="*:data-[slot=toggle-group-item]:px-3!"
          >
            {(Object.keys(RANGES) as Range[]).map((key) => (
              <ToggleGroupItem key={key} value={key}>
                {key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pt-2 sm:px-4">
        {loading ? (
          <Skeleton className="min-h-[240px] w-full flex-1" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto min-h-[240px] w-full flex-1">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="fillIssued" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-issuedDelta)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-issuedDelta)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillVerified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-verifiedDelta)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-verifiedDelta)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={[0, (max: number) => Math.max(1, Math.ceil(max * 1.1))]} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                ticks={range === '24h' ? undefined : dayTicks(series)}
                tickFormatter={(value: string) => formatTick(value, range)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(String(value)).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: range === '24h' || range === '7d' ? '2-digit' : undefined,
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="verifiedDelta"
                type="monotone"
                fill="url(#fillVerified)"
                stroke="var(--color-verifiedDelta)"
                stackId="a"
              />
              <Area
                dataKey="issuedDelta"
                type="monotone"
                fill="url(#fillIssued)"
                stroke="var(--color-issuedDelta)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
