'use client'

import { ScrollTextIcon } from 'lucide-react'
import type { CorporationGovernance } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import { GovernanceFrameworkActions } from '@/ui/common/governance-framework-actions'
import { ToneTag } from '@/ui/common/tone-tag'
import { Card, SectionHeader, SectionUnavailable } from './shared'

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
      <SectionHeader
        icon={<ScrollTextIcon />}
        title={translate('corporation.governance.title')}
        description={
          governance ? (
            <ToneTag tone="accent" dot className="mt-1 tabular-nums">
              {translate('corporation.governance.active', { version: governance.activeVersion })}
            </ToneTag>
          ) : null
        }
        action={
          governance ? (
            <GovernanceFrameworkActions
              target={{
                owner: { kind: 'corporation', id: corporationId },
                language,
                activeVersion: governance.activeVersion,
                versions: governance.versions,
              }}
              onRefresh={onRefresh}
            />
          ) : null
        }
      />
      {governance ? (
        <div className="min-w-0 overflow-x-auto">
          <EgfDocumentsTable versions={governance.versions} activeVersion={governance.activeVersion} />
        </div>
      ) : (
        <SectionUnavailable />
      )}
    </Card>
  )
}
