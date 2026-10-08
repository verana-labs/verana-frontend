'use client'

import type { CorporationGovernance } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import { GovernanceFrameworkActions } from '@/ui/common/governance-framework-actions'
import { Card, SectionTitle, SectionUnavailable } from './shared'

export function GovernanceSection({
  corporationId,
  language,
  governance,
  onRefresh,
}: {
  corporationId: number
  language: string
  governance: CorporationGovernance | null
  onRefresh: () => void
}) {
  return (
    <Card id="governance">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <SectionTitle>{translate('corporation.governance.title')}</SectionTitle>
          {governance ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {translate('corporation.governance.active', { version: governance.activeVersion })}
            </p>
          ) : null}
        </div>
        {governance ? (
          <GovernanceFrameworkActions
            target={{
              owner: { kind: 'corporation', id: corporationId },
              language,
              activeVersion: governance.activeVersion,
              versions: governance.versions,
            }}
            onRefresh={onRefresh}
          />
        ) : null}
      </div>
      {governance ? (
        <EgfDocumentsTable versions={governance.versions} activeVersion={governance.activeVersion} />
      ) : (
        <SectionUnavailable />
      )}
    </Card>
  )
}
