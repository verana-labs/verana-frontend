'use client'

import { useMemo } from 'react'
import { useSubmitTxMsgTypeFromObject } from '@/hooks/useSubmitTxMsgTypeFromObject'
import { translate } from '@/i18n/dataview'
import { NATIVE_PRICING } from '@/lib/pricing-asset'
import { useProtocolParams } from '@/providers/protocol-params-context'
import EditableDataView from '@/ui/common/data-edit'
import { boundedCredentialSchemaSections, type CredentialSchemaData } from '@/ui/dataview/datasections/cs'
import { resolveTranslatable } from '@/ui/dataview/types'

type AddCredentialSchemaPageProps = {
  ecosystemId: number
  onCancel: () => void
  onRefresh: (id?: string, txHeight?: number) => void
}

export default function AddCredentialSchemaPage({ ecosystemId, onCancel, onRefresh }: AddCredentialSchemaPageProps) {
  const params = useProtocolParams()
  const sections = useMemo(() => boundedCredentialSchemaSections(params), [params])
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
    holderOnboardingMode: 2,
    pricingAssetType: NATIVE_PRICING.pricingAssetType,
    pricingAsset: NATIVE_PRICING.pricingAsset,
    digestAlgorithm: 'sha384',
    archived: null,
    jsonSchema: '',
    title: resolveTranslatable({ key: 'ecosystem.credentialSchema.add.title' }, translate),
  }

  return (
    <EditableDataView<CredentialSchemaData>
      sectionsI18n={sections}
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
