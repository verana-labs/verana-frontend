'use client'

import { translate } from '@/i18n/dataview'
import type { DashboardData } from '@/ui/dataview/datasections/dashboard'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { formatNumber, formatVNAFromUVNA } from '@/util/util'

type Metric = {
  key: keyof DashboardData
  hint: string
  format: (value: DashboardData[keyof DashboardData]) => string
}

const asCount = (value: DashboardData[keyof DashboardData]) => formatNumber(String(value), true, true)

const METRICS: Metric[] = [
  { key: 'blockHeight', hint: 'Latest block processed by the indexer', format: asCount },
  { key: 'ecosystems', hint: 'Active ecosystems, network wide', format: asCount },
  { key: 'schemas', hint: 'Active credential schemas, network wide', format: asCount },
  { key: 'participants', hint: 'Participants across all ecosystems', format: asCount },
  {
    key: 'totalLockedTrustDeposit',
    hint: 'Trust deposit locked, network wide',
    format: (value) => formatVNAFromUVNA(value == null ? null : String(value)),
  },
  { key: 'issuedCredentials', hint: 'Credentials issued, network wide', format: asCount },
  { key: 'verifiedCredentials', hint: 'Credentials verified, network wide', format: asCount },
]

export function SectionCards({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {METRICS.map((metric) => {
        const value = data[metric.key]
        return (
          <Card
            key={metric.key}
            className={`@container/card ${metric.key === 'totalLockedTrustDeposit' ? '@xl/main:col-span-2' : ''}`}
          >
            <CardHeader>
              <CardDescription>{translate(`dataview.dashboard.fields.${metric.key}`)}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {value == null ? <Skeleton className="h-8 w-28" /> : metric.format(value)}
              </CardTitle>
            </CardHeader>
            <CardFooter className="border-0 bg-transparent pt-0 text-sm text-muted-foreground">
              {metric.hint}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
