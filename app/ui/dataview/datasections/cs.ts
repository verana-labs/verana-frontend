import { faBoxArchive, faEdit } from '@fortawesome/free-solid-svg-icons'
import { getModeLabel } from '@/ui/datatable/columnslist/cs'
import type { I18nValues } from '@/ui/dataview/types'
import { Section, typeOf } from '@/ui/dataview/types'
import { MSG_SCHEMA_ID } from '@/util/json_schema_util'

const t = (key: string, values?: I18nValues) => ({ key, values })

export interface CredentialSchemaData {
  id: string | number
  ecosystemId: string | number
  issuerGrantorValidationValidityPeriod: number
  verifierGrantorValidationValidityPeriod: number
  issuerValidationValidityPeriod: number
  verifierValidationValidityPeriod: number
  holderValidationValidityPeriod: number
  issuerOnboardingMode: string | number
  verifierOnboardingMode: string | number
  holderOnboardingMode: string | number | null
  pricingAssetType: string | number | null
  pricingAsset: string | null
  digestAlgorithm: string | null
  archived: string | null
  jsonSchema: string
  updateCredentialSchema?: string // action type
  archiveCredentialSchema?: string // action type
  unarchiveCredentialSchema?: string // action type
  state?: string
  title?: string
  description?: string
}

export const CredentialSchemaDataToken = typeOf<CredentialSchemaData>('CredentialSchemaData')

export const onboardingModeOptions = [
  { value: 1, label: t('dataview.cs.managementMode.OPEN') },
  { value: 2, label: t('dataview.cs.managementMode.ECOSYSTEM_ONBOARDING_PROCESS') },
  { value: 3, label: t('dataview.cs.managementMode.GRANTOR_ONBOARDING_PROCESS') },
]

export const credentialSchemaSections: Section<CredentialSchemaData>[] = [
  {
    name: t('dataview.cs.sections.main'),
    type: 'basic',
    classFormEdit: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6', //lg:grid-cols-3
    noEdit: true,
    fields: [
      {
        name: 'id',
        label: t('dataview.cs.fields.id'),
        type: 'data',
        required: true,
        update: false,
        show: 'edit view',
        // description: t("dataview.cs.descriptions.id"),
      },
      {
        name: 'state',
        label: t('dataview.cs.fields.id'),
        type: 'data',
        required: true,
        update: false,
        show: 'edit view',
        // description: t("dataview.cs.descriptions.id"),
      },
      {
        name: 'issuerOnboardingMode',
        label: t('dataview.cs.fields.issuerOnboardingMode'),
        type: 'data',
        required: true,
        update: false,
        inputType: 'select',
        options: onboardingModeOptions,
        format: (value) => getModeLabel(String(value), '_ISSUER'),
        isHtml: true,
      },
      {
        name: 'verifierOnboardingMode',
        label: t('dataview.cs.fields.verifierOnboardingMode'),
        type: 'data',
        required: true,
        update: false,
        inputType: 'select',
        options: onboardingModeOptions,
        format: (value) => getModeLabel(String(value), '_VERIFIER'),
        isHtml: true,
      },
      {
        name: 'holderOnboardingMode',
        label: t('dataview.cs.fields.holderOnboardingMode'),
        type: 'data',
        update: false,
        show: 'view',
      },
      {
        name: 'pricingAssetType',
        label: t('dataview.cs.fields.pricingAssetType'),
        type: 'data',
        update: false,
        show: 'view',
      },
      { name: 'pricingAsset', label: t('dataview.cs.fields.pricingAsset'), type: 'data', update: false, show: 'view' },
      {
        name: 'digestAlgorithm',
        label: t('dataview.cs.fields.digestAlgorithm'),
        type: 'data',
        update: false,
        show: 'view',
      },
      { name: 'ecosystemId', label: t('dataview.cs.fields.ecosystemId'), type: 'data', show: 'none' },
      {
        name: 'archiveCredentialSchema',
        label: t('dataview.cs.actions.archiveCredentialSchema'),
        type: 'action',
        icon: faBoxArchive,
        iconColorClass: 'bg-gray-600 text-white hover:bg-gray-700',
      },
      {
        name: 'unarchiveCredentialSchema',
        label: t('dataview.cs.actions.unarchiveCredentialSchema'),
        type: 'action',
        icon: faBoxArchive,
        iconColorClass: 'bg-green-600 text-white hover:bg-green-700',
      },
    ],
  },
  {
    name: t('dataview.section.mutable'),
    nameCreate: t('dataview.cs.sections.main'),
    type: 'basic',
    classFormEdit: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6', //lg:grid-cols-3
    fields: [
      {
        name: 'id',
        label: t('dataview.cs.fields.id'),
        type: 'data',
        required: true,
        update: false,
        show: 'none',
        // description: t("dataview.cs.descriptions.id"),
      },
      {
        name: 'issuerGrantorValidationValidityPeriod',
        label: t('dataview.cs.fields.issuerGrantorValidationValidityPeriod'),
        type: 'data',
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.issuerGrantorValidationValidityPeriod"),
      },
      {
        name: 'verifierGrantorValidationValidityPeriod',
        label: t('dataview.cs.fields.verifierGrantorValidationValidityPeriod'),
        type: 'data',
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.verifierGrantorValidationValidityPeriod"),
      },
      {
        name: 'issuerValidationValidityPeriod',
        label: t('dataview.cs.fields.issuerValidationValidityPeriod'),
        type: 'data',
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.issuerValidationValidityPeriod"),
      },
      {
        name: 'verifierValidationValidityPeriod',
        label: t('dataview.cs.fields.verifierValidationValidityPeriod'),
        type: 'data',
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.verifierValidationValidityPeriod"),
      },
      {
        name: 'holderValidationValidityPeriod',
        label: t('dataview.cs.fields.holderValidationValidityPeriod'),
        type: 'data',
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.holderValidationValidityPeriod"),
      },
      {
        name: 'issuerOnboardingMode',
        label: t('dataview.cs.fields.issuerOnboardingMode'),
        type: 'data',
        required: true,
        update: false,
        inputType: 'select',
        options: onboardingModeOptions,
        format: (value) => getModeLabel(String(value), '_ISSUER'),
        isHtml: true,
        show: 'create',
      },
      {
        name: 'verifierOnboardingMode',
        label: t('dataview.cs.fields.verifierOnboardingMode'),
        type: 'data',
        required: true,
        update: false,
        inputType: 'select',
        options: onboardingModeOptions,
        format: (value) => getModeLabel(String(value), '_VERIFIER'),
        isHtml: true,
        show: 'create',
      },
      {
        name: 'jsonSchema',
        label: t('dataview.cs.fields.jsonSchema'),
        type: 'data',
        inputType: 'textarea',
        required: true,
        update: false,
        description: t('dataview.cs.descriptions.jsonSchema', { id: MSG_SCHEMA_ID }),
        validation: { type: 'JSON_SCHEMA' },
        show: 'create',
      },
      { name: 'ecosystemId', label: t('dataview.cs.fields.ecosystemId'), type: 'data', show: 'none' },
      {
        name: 'updateCredentialSchema',
        label: t('dataview.cs.actions.updateCredentialSchema'),
        type: 'action',
        icon: faEdit,
        isEditButton: true,
      },
    ],
  },
  {
    name: t('dataview.cs.fields.jsonSchema'),
    type: 'basic',
    fields: [
      {
        name: 'jsonSchema',
        label: t('dataview.cs.fields.jsonSchema'),
        type: 'data',
        inputType: 'textarea',
        required: true,
        update: false,
        description: t('dataview.cs.descriptions.jsonSchema', { id: MSG_SCHEMA_ID }),
        validation: { type: 'JSON_SCHEMA' },
      },
    ],
  },
]
