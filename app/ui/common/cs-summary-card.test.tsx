import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CsSummaryCard from '@/ui/common/cs-summary-card'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'

const SCHEMA: CredentialSchemaListItem = {
  id: '2',
  ecosystemId: '2',
  title: 'OrganizationCredential',
  description: '',
  role: '',
  issuerOnboardingMode: 'ECOSYSTEM_ONBOARDING_PROCESS',
  verifierOnboardingMode: 'OPEN',
  holderOnboardingMode: 'ISSUER_ONBOARDING_PROCESS',
  pricingAssetType: null,
  pricingAsset: null,
  jsonSchema: '{}',
  participants: 0,
  issuedCredentials: 0,
  verifiedCredentials: 0,
  weight: '0',
  archived: null,
  issuerGrantorValidationValidityPeriod: 0,
  verifierGrantorValidationValidityPeriod: 0,
  issuerValidationValidityPeriod: 0,
  verifierValidationValidityPeriod: 0,
  holderValidationValidityPeriod: 0,
}

function render(credentialSchema: CredentialSchemaListItem): string {
  return renderToStaticMarkup(
    <CsSummaryCard credentialSchema={credentialSchema} onView={() => {}} onParticipants={() => {}} />
  )
}

describe('CsSummaryCard onboarding modes', () => {
  it('labels the issuer, verifier and holder modes', () => {
    const html = render(SCHEMA)
    expect(html).toMatch(/Issuer:<\/span><span[^>]*>ECOSYSTEM_ONBOARDING_PROCESS</)
    expect(html).toMatch(/Verifier:<\/span><span[^>]*>OPEN</)
    expect(html).toMatch(/Holder:<\/span><span[^>]*>ISSUER_ONBOARDING_PROCESS</)
  })

  it('leaves the holder row out when the schema has no holder mode', () => {
    expect(render({ ...SCHEMA, holderOnboardingMode: null })).not.toContain('Holder:')
  })
})
