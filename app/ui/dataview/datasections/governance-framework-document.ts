import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import type { Section } from '@/ui/dataview/types'

const t = (key: string) => ({ key })

export interface GovernanceFrameworkDocumentForm {
  docLanguage: string
  docUrl: string
}

export const governanceFrameworkDocumentSections: Section<GovernanceFrameworkDocumentForm>[] = [
  {
    name: t('dataview.governanceFrameworkDocument.sections.main'),
    icon: ShieldCheckIcon,
    type: 'basic',
    fields: [
      {
        name: 'docLanguage',
        label: t('dataview.governanceFrameworkDocument.fields.docLanguage'),
        type: 'data',
        inputType: 'languageSelector',
        show: 'create',
        required: true,
        update: true,
      },
      {
        name: 'docUrl',
        label: t('dataview.governanceFrameworkDocument.fields.docUrl'),
        type: 'data',
        show: 'create',
        required: true,
        update: true,
        validation: { type: 'URL' },
      },
    ],
  },
]
