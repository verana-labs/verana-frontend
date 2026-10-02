import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import type { Section } from '@/ui/dataview/types'

const t = (key: string) => ({ key })

export interface GovernanceFrameworkDocumentForm {
  targetVersion: string
  docLanguage: string
  docUrl: string
}

export function governanceFrameworkDocumentSections(
  targets: number[],
  existing: ReadonlySet<number>
): Section<GovernanceFrameworkDocumentForm>[] {
  return [
    {
      name: t('dataview.governanceFrameworkDocument.sections.main'),
      icon: ShieldCheckIcon,
      type: 'basic',
      fields: [
        {
          name: 'targetVersion',
          label: t('dataview.governanceFrameworkDocument.fields.targetVersion'),
          type: 'data',
          inputType: 'select',
          options: targets.map((version) => ({
            value: String(version),
            label: {
              key: existing.has(version)
                ? 'dataview.governanceFrameworkDocument.version.draft'
                : 'dataview.governanceFrameworkDocument.version.new',
              values: { version },
            },
          })),
          show: 'create',
          required: true,
          update: true,
        },
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
}
