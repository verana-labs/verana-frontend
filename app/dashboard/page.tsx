'use client'

import { useChain } from '@cosmos-kit/react'
import { faBuilding, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { type ReactNode, useEffect, useState } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useDashboardCtx } from '@/providers/api-rest-query-provider-context'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import DashboardFooter from '@/ui/common/dashboard-footer'
import DataView from '@/ui/common/data-view-columns'
import FeaturedServices from '@/ui/common/featured-services'
import GettingStarted from '@/ui/common/getting-started'
import TitleAndButton from '@/ui/common/title-and-button'
import { DashboardData, dashboardSections } from '@/ui/dataview/datasections/dashboard'
import { resolveTranslatable } from '@/ui/dataview/types'
import Wallet from '@/wallet/wallet'

function CallToAction({ title, message, action }: { title?: string; message?: string; action: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              <p className="text-primary-100 text-lg mb-4">{message}</p>
            </div>
            <div className="flex-shrink-0">{action}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

const CALL_TO_ACTION_BUTTON =
  'inline-flex items-center px-8 py-4 bg-white text-primary-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600'

export default function Page() {
  const veranaChain = useVeranaChain()
  const chainName = veranaChain.chain_name
  const { isWalletConnected } = useChain(chainName)
  const { memberships, actingCorporation, loading: corporationsLoading, error: discoveryError } = useUserCorporation()
  const noCorporation = isWalletConnected && !corporationsLoading && !discoveryError && memberships.length === 0

  // Block height from indexer ws
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

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({ key: 'dashboard.title' }, translate) ?? 'Dashboard'}
        description={[resolveTranslatable({ key: 'dashboard.desc' }, translate) ?? '']}
      />

      <DataView<DashboardData> sectionsI18n={dashboardSections} data={dashboardData} id="" loading={false} />

      {/* Wallet Connection CTA */}
      {!isWalletConnected && (
        <CallToAction
          title={resolveTranslatable({ key: 'notconnected.dashboard.title' }, translate)}
          message={resolveTranslatable({ key: 'notconnected.dashboard.msg' }, translate)}
          action={
            <div className={CALL_TO_ACTION_BUTTON}>
              <FontAwesomeIcon icon={faWallet} />
              <Wallet />
            </div>
          }
        />
      )}

      {noCorporation && (
        <CallToAction
          title={translate('nocorporation.dashboard.title')}
          message={translate('nocorporation.dashboard.msg')}
          action={
            <Link href="/corporation?create=1" className={`${CALL_TO_ACTION_BUTTON} gap-3`}>
              <FontAwesomeIcon icon={faBuilding} />
              {translate('corporation.selector.create')}
            </Link>
          }
        />
      )}

      {/* Featured Services */}
      <FeaturedServices isWalletConnected={isWalletConnected} hasCorporation={actingCorporation !== null} />

      {/* Getting Started Guide */}
      <GettingStarted />

      {/* Footer */}
      <DashboardFooter />
    </>
  )
}
