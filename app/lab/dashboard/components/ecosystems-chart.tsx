'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { translate } from '@/i18n/dataview'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/ui/shadcn/chart'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group'
import { shortenMiddle } from '@/util/util'

type Series = 'credentials' | 'participants'

const chartConfig = {
  issued: { label: translate('dataview.dashboard.fields.issuedCredentials'), color: 'var(--chart-1)' },
  verified: { label: translate('dataview.dashboard.fields.verifiedCredentials'), color: 'var(--chart-3)' },
  participants: { label: translate('dataview.dashboard.fields.participants'), color: 'var(--chart-1)' },
} satisfies ChartConfig

export function ecosystemName(ecosystem: EcosystemListItem): string {
  return ecosystem.trustData?.serviceName ?? ecosystem.trustData?.organizationName ?? shortenMiddle(ecosystem.did, 18)
}

export function EcosystemsChart({ ecosystems, loading }: { ecosystems: EcosystemListItem[]; loading: boolean }) {
  const [series, setSeries] = useState<Series>('credentials')
  const isMobile = useIsMobile()
  const maxTick = isMobile ? 6 : 12

  const data = [...ecosystems]
    .sort((a, b) =>
      series === 'credentials' ? b.issued + b.verified - (a.issued + a.verified) : b.participants - a.participants
    )
    .slice(0, 10)
    .map((ecosystem) => ({
      name: ecosystemName(ecosystem),
      issued: ecosystem.issued,
      verified: ecosystem.verified,
      participants: ecosystem.participants,
    }))

  const toggle = (
    <ToggleGroup
      type="single"
      value={series}
      onValueChange={(value) => value && setSeries(value as Series)}
      variant="outline"
      size="sm"
      className="*:data-[slot=toggle-group-item]:px-3!"
    >
      <ToggleGroupItem value="credentials">Credentials</ToggleGroupItem>
      <ToggleGroupItem value="participants">Participants</ToggleGroupItem>
    </ToggleGroup>
  )

  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle>Top ecosystems</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              Ten most active ecosystems listed on Discover, live from the indexer
            </span>
            <span className="@[540px]/card:hidden">Top 10, live from the indexer</span>
          </CardDescription>
        </div>
        {toggle}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading && data.length === 0 ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tickFormatter={(value: string) => (value.length > maxTick ? `${value.slice(0, maxTick - 1)}…` : value)}
              />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              {series === 'credentials' ? (
                <>
                  <Bar dataKey="issued" stackId="c" fill="var(--color-issued)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="verified" stackId="c" fill="var(--color-verified)" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <Bar dataKey="participants" fill="var(--color-participants)" radius={4} />
              )}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
