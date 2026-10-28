import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Section } from '@/ui/dataview/types'

export interface AccountActionsData {
  balance: string | null
  network: string | null
  getVNA: string | null
}

export const accountActionSections: Section<AccountActionsData>[] = [
  {
    type: 'actions',
    name: { key: 'dataview.account.sections.accountActions' },
    fields: [
      {
        name: 'getVNA',
        label: { key: 'dataview.account.actions.getVNA.label' },
        type: 'action',
        description: { key: 'dataview.account.actions.getVNA.desc' },
        icon: faPlus,
        iconClass: 'bg-success/10 ring-1 ring-success/20',
        iconColorClass: 'text-success',
      },
    ],
  },
]
