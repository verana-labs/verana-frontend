'use client'

import { useRouter } from 'next/navigation'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { CorporationDiscoveryFailure } from '@/ui/common/corporation-discovery-failure'
import { CorporationCreateWizard } from '@/ui/corporation/create-wizard'

export default function NewCorporationPage() {
  const router = useRouter()
  const { actingCorporation, loading, error, refetch } = useUserCorporation()
  const exit = actingCorporation ? '/corporation' : '/dashboard'

  return (
    <>
      {!actingCorporation && error ? (
        <p className="mb-2 text-sm font-medium text-destructive">{translate('corporation.page.error')}</p>
      ) : null}
      {actingCorporation ? null : <CorporationDiscoveryFailure />}
      {!loading && !actingCorporation && !error ? (
        <p className="mb-4 rounded-lg bg-tint-accent px-4 py-2.5 text-sm text-primary">
          {translate('corporation.page.nocorp')}
        </p>
      ) : null}
      <CorporationCreateWizard
        back={{
          href: exit,
          label: translate(actingCorporation ? 'corporation.page.title' : 'dashboard.title'),
        }}
        onCancel={() => router.push(exit)}
        onDone={() => {
          void refetch().finally(() => router.push('/corporation'))
        }}
      />
    </>
  )
}
