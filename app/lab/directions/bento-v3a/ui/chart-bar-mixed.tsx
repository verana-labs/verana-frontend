'use client'

import { UsersIcon } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/ui/shadcn/chart'
import { Skeleton } from '@/ui/shadcn/skeleton'

export type RoleCount = { role: Role; participants: number }
export type Role = 'ecosystem' | 'issuer' | 'verifier' | 'holder' | 'issuerGrantor' | 'verifierGrantor'

const chartConfig = {
  participants: {
    label: 'Participants',
  },
  ecosystem: {
    label: 'Ecosystem',
    color: 'var(--chart-4)',
  },
  issuer: {
    label: 'Issuer',
    color: 'var(--chart-1)',
  },
  verifier: {
    label: 'Verifier',
    color: 'var(--chart-2)',
  },
  holder: {
    label: 'Holder',
    color: 'var(--chart-3)',
  },
  issuerGrantor: {
    label: 'Issuer grantor',
    color: 'var(--chart-5)',
  },
  verifierGrantor: {
    label: 'Verifier grantor',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

export function ChartBarMixed({
  roles,
  total,
  joined,
  period,
  className,
}: {
  roles: RoleCount[] | null
  total: number | null
  joined: number
  period: string
  className?: string
}) {
  const chartData = (roles ?? []).map((r) => ({ ...r, fill: `var(--color-${r.role})` }))

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Participants by role</CardTitle>
        <CardDescription>Who takes part in Verana ecosystems</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {roles === null ? (
          <Skeleton className="w-full flex-1" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto min-h-[180px] w-full flex-1">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                left: 0,
              }}
            >
              <YAxis
                dataKey="role"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={84}
                tickFormatter={(value: string) => chartConfig[value as Role]?.label}
              />
              <XAxis dataKey="participants" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="participants" radius={5} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {total === null ? 'Counting participants' : `${total.toLocaleString('en-US')} participants in total`}
          <UsersIcon className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          {joined > 0 ? `${joined.toLocaleString('en-US')} joined in the ${period}` : `No one joined in the ${period}`}
        </div>
      </CardFooter>
    </Card>
  )
}
