'use client'

import type * as React from 'react'
import { useEffect } from 'react'
import { translate } from '@/i18n/dataview'
import { ActivityChart } from '@/lab/dashboard/components/activity-chart'
import { AppSidebar } from '@/lab/dashboard/components/app-sidebar'
import { EcosystemsTable } from '@/lab/dashboard/components/ecosystems-table'
import { SectionCards } from '@/lab/dashboard/components/section-cards'
import { SiteHeader } from '@/lab/dashboard/components/site-header'
import { useDashboardCtx, useDiscoverCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { SidebarInset, SidebarProvider } from '@/ui/shadcn/sidebar'
import { TooltipProvider } from '@/ui/shadcn/tooltip'

export default function LabDashboardPage() {
  const { latestProcessedHeight } = useIndexerEvents()
  const dashboardCtx = useDashboardCtx()
  const discoverCtx = useDiscoverCtx()

  useEffect(() => {
    void dashboardCtx.refetch()
  }, [dashboardCtx.refetch])

  const data = { ...dashboardCtx.dashboardData, blockHeight: latestProcessedHeight || null }
  const ecosystemsLoading = discoverCtx.loading && discoverCtx.discoverList.length === 0

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title={translate('dashboard.title')} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards data={data} />
                <div className="px-4 lg:px-6">
                  <ActivityChart />
                </div>
                <EcosystemsTable
                  ecosystems={discoverCtx.discoverList}
                  loading={ecosystemsLoading}
                  pager={discoverCtx}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
