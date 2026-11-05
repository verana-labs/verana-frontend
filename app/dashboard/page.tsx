'use client'

import { useChain } from '@cosmos-kit/react'
import { BadgeCheckIcon, BlocksIcon, CheckIcon, CoinsIcon, FileTextIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useDashboardCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import DashboardFooter from '@/ui/common/dashboard-footer'
import FeaturedServices from '@/ui/common/featured-services'
import GettingStarted from '@/ui/common/getting-started'
import TitleAndButton from '@/ui/common/title-and-button'
import { type CountTile, CountTiles } from '@/ui/dashboard/count-tiles'
import { CorporationCallToAction, WalletCallToAction } from '@/ui/dashboard/wallet-card'
import type { DashboardData } from '@/ui/dataview/datasections/dashboard'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatNumber, formatVNAFromUVNA } from '@/util/util'

const formatCount = (value: unknown) => formatNumber(String(value), true, true)

export default function Page() {
  const veranaChain = useVeranaChain()
  const chainName = veranaChain.chain_name
  const { isWalletConnected } = useChain(chainName)
  const { memberships, actingCorporation, loading: corporationsLoading, error: discoveryError } = useUserCorporation()
  const noCorporation = isWalletConnected && !corporationsLoading && !discoveryError && memberships.length === 0

  const { latestProcessedHeight } = useIndexerEvents()
  const dashboardCtx = useDashboardCtx()
  const [dashboardData, setDashboardData] = useState<DashboardData>({})

  const [refresh, setRefresh] = useState<boolean>(true)

  useEffect(() => {
    setDashboardData((prev) => ({
      ...dashboardCtx.dashboardData,
      blockHeight: latestProcessedHeight || null,
    }))
  }, [latestProcessedHeight, dashboardCtx.dashboardData])

  useEffect(() => {
    if (!refresh) return
    ;(async () => {
      await dashboardCtx.refetch()
      setRefresh(false)
    })()
  }, [refresh, dashboardCtx.refetch])

  const tiles: (CountTile & { stat: keyof DashboardData })[] = [
    {
      stat: 'blockHeight',
      name: translate('dataview.dashboard.fields.blockHeight'),
      Icon: BlocksIcon,
      display: formatCount(dashboardData.blockHeight),
    },
    {
      stat: 'ecosystems',
      name: translate('dataview.dashboard.fields.ecosystems'),
      Icon: ShieldIcon,
      display: formatCount(dashboardData.ecosystems),
    },
    {
      stat: 'schemas',
      name: translate('dataview.dashboard.fields.schemas'),
      Icon: FileTextIcon,
      display: formatCount(dashboardData.schemas),
    },
    {
      stat: 'participants',
      name: translate('dataview.dashboard.fields.participants'),
      Icon: UsersIcon,
      display: formatCount(dashboardData.participants),
    },
    {
      stat: 'totalLockedTrustDeposit',
      name: translate('dataview.dashboard.fields.totalLockedTrustDeposit'),
      Icon: CoinsIcon,
      display: formatVNAFromUVNA(String(dashboardData.totalLockedTrustDeposit)),
    },
    {
      stat: 'issuedCredentials',
      name: translate('dataview.dashboard.fields.issuedCredentials'),
      Icon: BadgeCheckIcon,
      display: formatCount(dashboardData.issuedCredentials),
    },
    {
      stat: 'verifiedCredentials',
      name: translate('dataview.dashboard.fields.verifiedCredentials'),
      Icon: CheckIcon,
      display: formatCount(dashboardData.verifiedCredentials),
    },
  ]

  return (
    <div className="@container/page flex flex-col gap-4 @5xl/page:gap-5">
      <TitleAndButton
        title={resolveTranslatable({ key: 'dashboard.title' }, translate) ?? 'Dashboard'}
        description={[resolveTranslatable({ key: 'dashboard.desc' }, translate) ?? '']}
      />

      <CountTiles tiles={tiles.filter((tile) => dashboardData[tile.stat] != null)} />

      {!isWalletConnected ? <WalletCallToAction /> : null}

      {noCorporation ? <CorporationCallToAction /> : null}

      <FeaturedServices
        isWalletConnected={isWalletConnected}
        hasCorporation={actingCorporation !== null || (corporationsLoading || discoveryError ? undefined : false)}
      />

      <GettingStarted />

      <DashboardFooter className="mt-4" />
    </div>
  )
}
