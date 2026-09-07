'use client'

import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { translate } from '@/i18n/dataview'
import EditableDataView from '@/ui/common/data-edit'
import { type CredentialSchemaData, credentialSchemaSections } from '@/ui/dataview/datasections/cs'
import { resolveTranslatable } from '@/ui/dataview/types'

type AddCredentialSchemaPageProps = {
  ecosystemId: number
  onCancel: () => void
  onRefresh: (id?: string, txHeight?: number) => void
}

export default function AddCredentialSchemaPage({ ecosystemId, onCancel, onRefresh }: AddCredentialSchemaPageProps) {
  const { submitTx } = useSubmitTxMsgTypeFromObject(onCancel, onRefresh)
  const credentialSchema: CredentialSchemaData = {
    id: '',
    ecosystemId,
    issuerGrantorValidationValidityPeriod: 365,
    verifierGrantorValidationValidityPeriod: 365,
    issuerValidationValidityPeriod: 365,
    verifierValidationValidityPeriod: 365,
    holderValidationValidityPeriod: 365,
    issuerOnboardingMode: 1,
    verifierOnboardingMode: 1,
    holderOnboardingMode: null,
    pricingAssetType: null,
    pricingAsset: null,
    digestAlgorithm: null,
    archived: null,
    jsonSchema: '',
    title: resolveTranslatable({ key: 'ecosystem.credentialSchema.add.title' }, translate),
  }

  return (
    <EditableDataView<CredentialSchemaData>
      sectionsI18n={credentialSchemaSections}
      id={undefined}
      messageType="MsgCreateCredentialSchema"
      data={credentialSchema}
      onSave={async (value) => {
        await submitTx('MsgCreateCredentialSchema', value)
      }}
      onCancel={onCancel}
      isModal={true}
    />
  )
}
