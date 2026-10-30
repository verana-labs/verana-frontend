import { translate } from '@/i18n/dataview'
import type { HolderOnboardingMode, ParticipantOnboardingMode } from '@/lib/participant-onboarding'
import { Column } from '@/ui/datatable/types'
import { type I18nValues, type Translatable } from '@/ui/dataview/types'
import { BADGE_TONE, type BadgeTone, formatNumber } from '@/util/util'

const t = (key: string, values?: I18nValues) => ({ key, values })

export interface CredentialSchemaListItem {
  id: string
  ecosystemId: string
  title: string
  description: string
  role: string
  issuerOnboardingMode: ParticipantOnboardingMode
  verifierOnboardingMode: ParticipantOnboardingMode
  holderOnboardingMode: HolderOnboardingMode | null
  pricingAssetType: string | null
  pricingAsset: string | null
  jsonSchema: string
  participants: number
  issuedCredentials: number
  verifiedCredentials: number
  weight: string
  archived: string | null
  issuerGrantorValidationValidityPeriod: number
  verifierGrantorValidationValidityPeriod: number
  issuerValidationValidityPeriod: number
  verifierValidationValidityPeriod: number
  holderValidationValidityPeriod: number
}

const MODE_TONE: Record<string, BadgeTone> = {
  ECOSYSTEM_ONBOARDING_PROCESS_ISSUER: 'primary',
  ECOSYSTEM_ONBOARDING_PROCESS_VERIFIER: 'primary',
  GRANTOR_ONBOARDING_PROCESS_ISSUER: 'info',
  GRANTOR_ONBOARDING_PROCESS_VERIFIER: 'muted',
  OPEN_ISSUER: 'success',
  OPEN_VERIFIER: 'warning',
  ISSUER_ONBOARDING_PROCESS_HOLDER: 'info',
  PERMISSIONLESS_HOLDER: 'success',
}

export const columnsCredentialSchemaList: Column<CredentialSchemaListItem>[] = [
  { header: t('datatable.cs.header.id'), accessor: 'id', className: 'font-medium' },
  { header: t('datatable.cs.header.title'), accessor: 'title', break: 'break-words' },
  {
    header: t('datatable.cs.header.desc'),
    accessor: 'description',
    priority: 4,
    break: 'break-words',
    className: 'text-neutral-70 dark:text-neutral-70',
  },
  {
    header: t('datatable.cs.header.participants'),
    accessor: 'participants',
    format: (value) => formatNumber(value, true),
  },
  {
    header: t('datatable.cs.header.issuedCredentials'),
    accessor: 'issuedCredentials',
    format: (value) => formatNumber(value, true),
  },
  {
    header: t('datatable.cs.header.verifiedCredentials'),
    accessor: 'verifiedCredentials',
    format: (value) => formatNumber(value, true),
  },
]

export const description: Translatable[] = [t('datatable.cs.description')]

export function getModePillClass(value: string, suffix: string): string {
  if (!value?.trim()) return ''
  const tone = MODE_TONE[value.concat(suffix)]
  return tone ? BADGE_TONE[tone] : ''
}

export function getModeLabel(value: string): string {
  if (!value?.trim()) return ''
  const key = `dataview.cs.managementMode.${value}`
  const label = translate(key)
  return label === key ? value : label
}
