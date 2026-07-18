import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import type { Column, Filter } from '@/ui/datatable/types'
import type { I18nValues, Translatable } from '@/ui/dataview/types'
import { formatNumber, formatVNAFromUVNA, shortenDID } from '@/util/util'

const t = (key: string, values?: I18nValues) => ({ key, values })

export interface EcosystemListItem {
  id: string
  did: string
  corporationId: number
  created: string
  modified: string
  language: string
  role: string
  versions?: {
    id: string
    version: number
    activeSince: string | null
    documents?: {
      id: string
      url: string
      language: string
    }[]
  }[]
  activeVersion: number
  activeSchemas: number
  participants: number
  weight: string
  issued: number
  verified: number
  archived: string | null
  credentialSchemas?: CredentialSchemaListItem[]
}

export const ecosystemFilter: Filter<EcosystemListItem>[] = [
  {
    label: t('datatable.ecosystem.filter.did.label'),
    columns: ['did'],
    inputType: 'text',
    placeholder: t('datatable.ecosystem.filter.did.placeholder'),
  },
]

export const ecosystemColumns: Column<EcosystemListItem>[] = [
  { header: t('datatable.ecosystem.header.id'), accessor: 'id', className: 'font-medium' },
  {
    header: t('datatable.ecosystem.header.did'),
    accessor: 'did',
    format: (value) => shortenDID(String(value)),
    break: 'break-all',
  },
  {
    header: t('datatable.ecosystem.header.corporation'),
    accessor: 'corporationId',
    format: (value) => formatNumber(value, true),
    priority: 5,
  },
  {
    header: t('datatable.ecosystem.header.activeSchemas'),
    accessor: 'activeSchemas',
    format: (value) => formatNumber(value, true),
    priority: 4,
  },
  {
    header: t('datatable.ecosystem.header.participants'),
    accessor: 'participants',
    format: (value) => formatNumber(value, true),
  },
  {
    header: t('datatable.ecosystem.header.trustDeposit'),
    accessor: 'weight',
    format: (value) => formatVNAFromUVNA(String(value)),
  },
  {
    header: t('datatable.ecosystem.header.issuedCredentials'),
    accessor: 'issued',
    format: (value) => formatNumber(value, true),
  },
  {
    header: t('datatable.ecosystem.header.verifiedCredentials'),
    accessor: 'verified',
    format: (value) => formatNumber(value, true),
  },
]

export const ecosystemDescription: Translatable[] = [t('datatable.ecosystem.description')]
