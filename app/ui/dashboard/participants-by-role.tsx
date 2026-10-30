'use client'

import { useReducedMotion } from 'framer-motion'
import { TriangleAlertIcon, UsersIcon } from 'lucide-react'
import { useId, useMemo } from 'react'
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { BlockHeader } from '@/ui/common/block-card'
import { CHART_BAR_CURSOR, chartGradientId } from '@/ui/common/chart-craft'
import { ChartTooltipCard } from '@/ui/common/chart-tooltip-card'
import { DeltaPill, type DeltaPillProps } from '@/ui/common/delta-pill'
import { formatCount } from '@/ui/dashboard/format'
import type { Role, RoleCount } from '@/ui/dashboard/network-data'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/ui/shadcn/chart'

const ROLES: Role[] = ['ecosystem', 'issuer', 'verifier', 'holder', 'issuerGrantor', 'verifierGrantor']

export function ParticipantsByRole({
  roles,
  rolesError,
  onRetry,
  total,
  joined,
  joinedDelta,
  period,
  className,
}: {
  roles: RoleCount[] | null
  rolesError: boolean
  onRetry: () => void
  total: number | null
  joined: number
  joinedDelta: DeltaPillProps | null
  period: string
  className?: string
}) {
  const chartConfig: ChartConfig = {
    participants: { label: translate('dataview.dashboard.fields.participants'), color: 'var(--chart-1)' },
    ...Object.fromEntries(ROLES.map((role) => [role, { label: translate(`dashboard.roles.${role}`) }])),
  }
  const chartData = useMemo(() => roles ?? [], [roles])
  const fillId = chartGradientId(useId())
  const reducedMotion = useReducedMotion() ?? false

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <BlockHeader
          icon={<UsersIcon />}
          title={translate('dashboard.roles.title')}
          caption={translate('dashboard.roles.desc')}
        />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {roles === null ? (
          rolesError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
              <TriangleAlertIcon aria-hidden="true" className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{translate('dashboard.stats.error')}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {translate('dashboard.retry')}
              </Button>
            </div>
          ) : (
            <Shimmer className="min-h-[160px] w-full flex-1" />
          )
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-44 min-h-[160px] w-full @5xl/page:h-auto @5xl/page:flex-1"
          >
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 0, right: 32 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-participants)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-participants)" stopOpacity={1} />
                </linearGradient>
              </defs>
              <YAxis
                dataKey="role"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={96}
                tickFormatter={(value: string) => String(chartConfig[value]?.label ?? value)}
              />
              <XAxis dataKey="participants" type="number" hide />
              <ChartTooltip cursor={CHART_BAR_CURSOR} content={<ChartTooltipCard hideLabel />} />
              <Bar
                dataKey="participants"
                fill={`url(#${fillId})`}
                radius={4}
                minPointSize={2}
                isAnimationActive={!reducedMotion}
              >
                <LabelList
                  dataKey="participants"
                  position="right"
                  offset={8}
                  className="fill-foreground font-medium tabular-nums"
                  fontSize={12}
                  formatter={(value: unknown) => formatCount(Number(value))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div
          data-stat="participants"
          data-stat-value={total === null ? undefined : formatCount(total)}
          className="flex items-center gap-2 leading-none"
        >
          <UsersIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">{translate('dataview.dashboard.fields.participants')}</span>
          <span className="font-semibold tabular-nums">
            {total !== null ? (
              formatCount(total)
            ) : rolesError ? (
              '—'
            ) : (
              <Shimmer className="inline-block h-4 w-8 align-middle" />
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs leading-none text-muted-foreground">
          <span>
            {joined > 0
              ? translate('dashboard.roles.joined', { count: formatCount(joined), range: period })
              : translate('dashboard.roles.nojoin', { range: period })}
          </span>
          {joinedDelta ? <DeltaPill {...joinedDelta} /> : null}
        </div>
      </CardFooter>
    </Card>
  )
}
