'use client'

import { ScrollTextIcon } from 'lucide-react'
import type { CorporationGovernance } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import { GovernanceFrameworkActions } from '@/ui/common/governance-framework-actions'
import { Badge } from '@/ui/shadcn/badge'
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
            <Badge variant="outline" className="mt-0.5 border-primary/25 bg-primary/10 text-primary tabular-nums">
              {translate('corporation.governance.active', { version: governance.activeVersion })}
            </Badge>
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
