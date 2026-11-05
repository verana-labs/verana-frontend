'use client'

import { FileJson2Icon } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { translate } from '@/i18n/dataview'
import { EmptyState } from '@/ui/common/empty-state'
import { AddCredentialSchemaWizard } from './add'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default function AddCredentialSchemaRoute({ searchParams }: Props) {
  const { ecosystem } = use(searchParams)
  const ecosystemId = Number(Array.isArray(ecosystem) ? ecosystem[0] : ecosystem)
  if (!Number.isSafeInteger(ecosystemId) || ecosystemId <= 0) {
    return (
      <EmptyState
        icon={<FileJson2Icon />}
        title={translate('wizard.schema.noecosystem')}
        description={translate('wizard.schema.noecosystem.desc')}
        action={
          <Link href="/ecosystems" className="btn-link">
            {translate('ecosystemList.title')}
          </Link>
        }
      />
    )
  }
  return <AddCredentialSchemaWizard ecosystemId={ecosystemId} />
}
