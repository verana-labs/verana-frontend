'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VERANA_FAUCET_URL } from '@/config/env'
import { translate } from '@/i18n/dataview'
import { useAccountCtx } from '@/providers/api-rest-query-provider-context'
import { AccountAddress } from '@/ui/account/account-address'
import { AccountCorporations } from '@/ui/account/account-corporations'
import ColumnsDataView from '@/ui/common/data-view-columns'
import { GET_VNA_ACTION } from '@/ui/common/get-vna'
import TitleAndButton from '@/ui/common/title-and-button'
import { AccountData, accountSections } from '@/ui/dataview/datasections/account'
import { resolveTranslatable } from '@/ui/dataview/types'

export default function AccountPage() {
  const searchParams = useSearchParams()
  // Only pre-open the "getVNA" action if the URL includes ?getVNA=true
  const openGetVNA = searchParams.get('getVNA') === 'true'

  const { accountData, refetch: refetchAccount } = useAccountCtx()
  const [refresh, setRefresh] = useState<boolean>(true)

  useEffect(() => {
    if (!refresh) return
    ;(async () => {
      await refetchAccount()
      setRefresh(false)
    })()
  }, [refresh, refetchAccount])

  // State for processed account data to display in DataView
  const [data, setData] = useState<AccountData>()

  useEffect(() => {
    if (accountData) {
      // Per [VFE-PAGE-ACCT-3]: no faucet URL, no Get VNA action.
      const getVNA = VERANA_FAUCET_URL ? GET_VNA_ACTION : null
      setData({ ...accountData, getVNA })
    }
  }, [accountData])

  return (
    <>
      <TitleAndButton
        title={resolveTranslatable({ key: 'account.title' }, translate) ?? 'Account'}
        description={[resolveTranslatable({ key: 'account.desc' }, translate) ?? '']}
      />
      <AccountAddress />
      {data && (
        <ColumnsDataView<AccountData>
          sectionsI18n={accountSections}
          data={data}
          onRefresh={() => setRefresh(true)}
          activeActionField={openGetVNA ? 'getVNA' : undefined}
          loading={false}
        />
      )}
      <AccountCorporations />
    </>
  )
}
