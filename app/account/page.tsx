'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VERANA_FAUCET_URL } from '@/config/env'
import { translate } from '@/i18n/dataview'
import { useAccountCtx } from '@/providers/api-rest-query-provider-context'
import { type AccountActionsData, accountActionSections } from '@/ui/account/account-actions'
import { AccountAddress } from '@/ui/account/account-address'
import { AccountBalance } from '@/ui/account/account-balance'
import { AccountCorporations } from '@/ui/account/account-corporations'
import ColumnsDataView from '@/ui/common/data-view-columns'
import { GET_VNA_ACTION } from '@/ui/common/get-vna'
import { SEND_RECIPIENT_PARAM, SEND_VNA_ACTION } from '@/ui/common/send-vna'
import TitleAndButton from '@/ui/common/title-and-button'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'

export default function AccountPage() {
  const searchParams = useSearchParams()
  const openGetVNA = searchParams.get('getVNA') === 'true'
  const openSendVNA = searchParams.has(SEND_RECIPIENT_PARAM)

  const { accountData, refetch: refetchAccount } = useAccountCtx()
  const [refresh, setRefresh] = useState<boolean>(true)

  useEffect(() => {
    if (!refresh) return
    ;(async () => {
      await refetchAccount()
      setRefresh(false)
    })()
  }, [refresh, refetchAccount])

  const getVNA = VERANA_FAUCET_URL ? GET_VNA_ACTION : null
  const data: AccountActionsData = { ...accountData, getVNA, sendVNA: SEND_VNA_ACTION }

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({ key: 'account.title' }, translate) ?? 'Account'}
        description={[resolveTranslatable({ key: 'account.desc' }, translate) ?? '']}
      />
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5 xl:gap-5">
          <BlurFade className={accountData.balance == null ? 'xl:col-span-5' : 'xl:col-span-3'}>
            <AccountAddress />
          </BlurFade>
          {accountData.balance == null ? null : (
            <BlurFade delay={0.05} className="xl:col-span-2">
              <AccountBalance balance={accountData.balance} />
            </BlurFade>
          )}
        </div>
        <BlurFade delay={0.1}>
          <ColumnsDataView<AccountActionsData>
            sectionsI18n={accountActionSections}
            data={data}
            onRefresh={() => setRefresh(true)}
            activeActionField={openGetVNA ? 'getVNA' : openSendVNA ? 'sendVNA' : undefined}
            loading={false}
          />
        </BlurFade>
        <BlurFade delay={0.15}>
          <AccountCorporations />
        </BlurFade>
      </div>
    </>
  )
}
