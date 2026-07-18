import { faBoxArchive, faEdit } from '@fortawesome/free-solid-svg-icons'
import type { Section } from '@/ui/dataview/types'
import type { CredentialSchemaData } from './cs'

const t = (key: string) => ({ key })

export interface EcosystemData {
  id: string
  did: string
  corporationId: number
  language: string
  created: string
  modified: string
  archived: string | null
  activeVersion: number
  activeSchemas: number
  participants: number
  weight: string
  issued: number
  verified: number
  versions: {
    id: string
    version: number
    activeSince: string | null
    documents: {
      id: string
      url: string
      language: string
      digestSri?: string
    }[]
  }[]
  docUrl?: string
  role?: string
  schemas?: string
  docs?: string[]
  addGovernanceFrameworkDocument?: string
  increaseActiveGovernanceFrameworkVersion?: string
  lastVersion?: number
  credentialSchemas?: CredentialSchemaData[]
  title?: string
  description?: string
  updateEcosystem?: string
  archiveEcosystem?: string
  unarchiveEcosystem?: string
}

export const ecosystemSections: Section<EcosystemData>[] = [
  {
    name: t('dataview.ecosystem.sections.basicInformation'),
    type: 'basic',
    classFormEdit: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6',
    noEdit: true,
    fields: [
      {
        name: 'id',
        label: t('dataview.ecosystem.fields.id'),
        type: 'data',
        show: 'view',
        update: false,
        id: true,
      },
      {
        name: 'did',
        label: t('dataview.ecosystem.fields.did'),
        type: 'data',
        show: 'none',
        required: true,
        update: true,
        placeholder: 'did:method:identifier',
        validation: { type: 'DID' },
      },
      {
        name: 'corporationId',
        label: t('dataview.ecosystem.fields.corporationId'),
        type: 'data',
        show: 'view',
        update: false,
      },
      {
        name: 'language',
        label: t('dataview.ecosystem.fields.language'),
        type: 'data',
        inputType: 'languageSelector',
        show: 'view',
        required: false,
        update: false,
      },
      { name: 'created', label: t('dataview.ecosystem.fields.created'), type: 'data', show: 'none' },
      { name: 'modified', label: t('dataview.ecosystem.fields.modified'), type: 'data', show: 'none' },
      {
        name: 'activeVersion',
        label: t('dataview.ecosystem.fields.activeVersion'),
        type: 'data',
        show: 'view',
      },
      {
        name: 'archiveEcosystem',
        label: t('dataview.ecosystem.actions.archiveEcosystem'),
        type: 'action',
        icon: faBoxArchive,
        iconColorClass: 'bg-gray-600 text-white hover:bg-gray-700',
      },
      {
        name: 'unarchiveEcosystem',
        label: t('dataview.ecosystem.actions.unarchiveEcosystem'),
        type: 'action',
        icon: faBoxArchive,
        iconColorClass: 'bg-green-600 text-white hover:bg-green-700',
      },
    ],
  },
  {
    name: t('dataview.section.mutable'),
    nameCreate: t('dataview.ecosystem.sections.basicInformation'),
    type: 'basic',
    classFormEdit: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6',
    classFormCreate: 'space-y-6 mb-6',
    fields: [
      {
        name: 'id',
        label: t('dataview.ecosystem.fields.id'),
        type: 'data',
        show: 'none',
        update: false,
        id: true,
      },
      {
        name: 'did',
        label: t('dataview.ecosystem.fields.did'),
        type: 'data',
        show: 'all',
        required: true,
        update: true,
        placeholder: 'did:method:identifier',
        validation: { type: 'DID' },
      },
      {
        name: 'corporationId',
        label: t('dataview.ecosystem.fields.corporationId'),
        type: 'data',
        show: 'none',
        update: false,
      },
      {
        name: 'language',
        label: t('dataview.ecosystem.fields.language'),
        type: 'data',
        inputType: 'languageSelector',
        show: 'create',
        required: true,
        update: false,
      },
      {
        name: 'docUrl',
        label: t('dataview.ecosystem.fields.docUrl'),
        type: 'data',
        show: 'create',
        required: true,
        update: false,
        placeholder: 'https://example.com/governance-framework.pdf',
        validation: { type: 'URL' },
      },
      {
        name: 'updateEcosystem',
        label: t('dataview.ecosystem.actions.updateEcosystem'),
        type: 'action',
        icon: faEdit,
        isEditButton: true,
      },
    ],
  },
]

export interface GovernanceFrameworkData {
  docs?: string[]
  addGovernanceFrameworkDocument?: string
  increaseActiveGovernanceFrameworkVersion?: string
}

export const governanceFrameworkSections: Section<GovernanceFrameworkData>[] = [
  {
    name: t('dataview.ecosystem.sections.governanceFrameworkDocuments'),
    type: 'advanced',
    fields: [
      { name: 'docs', label: t('dataview.ecosystem.fields.docs'), type: 'list', objectData: 'string' },
      {
        name: 'addGovernanceFrameworkDocument',
        label: t('dataview.ecosystem.actions.addGovernanceFrameworkDocument'),
        type: 'action',
      },
      {
        name: 'increaseActiveGovernanceFrameworkVersion',
        label: t('dataview.ecosystem.actions.increaseActiveGovernanceFrameworkVersion'),
        type: 'action',
      },
    ],
  },
]
