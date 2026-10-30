'use client'

import { useRouter } from 'next/navigation'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { CorporationCreateWizard } from '@/ui/corporation/create-wizard'

export default function NewCorporationPage() {
  const router = useRouter()
  const { actingCorporation, loading, error, refetch } = useUserCorporation()
  const exit = actingCorporation ? '/corporation' : '/dashboard'

  return (
    <>
      {!loading && !actingCorporation && error ? (
        <div className="mb-4 error-pane">{translate('corporation.page.error')}</div>
      ) : null}
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
