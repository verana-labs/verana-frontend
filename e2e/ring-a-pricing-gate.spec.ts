import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { ACME_DID, HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'

const TU_SCHEMA_ID = 77
const COIN_SCHEMA_ID = 78
const ECOSYSTEM_ID = 13

function schema(id: number, pricingAssetType: string, pricingAsset: string) {
  return {
    id,
    ecosystem_id: ECOSYSTEM_ID,
    json_schema: JSON.stringify({ title: `Schema ${id}`, description: 'Pricing gate fixture', type: 'object' }),
    issuer_grantor_validation_validity_period: 0,
    verifier_grantor_validation_validity_period: 0,
    issuer_validation_validity_period: 365,
    verifier_validation_validity_period: 365,
    holder_validation_validity_period: 0,
    issuer_onboarding_mode: 'ECOSYSTEM_ONBOARDING_PROCESS',
    verifier_onboarding_mode: 'OPEN',
    holder_onboarding_mode: 'PERMISSIONLESS',
    pricing_asset_type: pricingAssetType,
    pricing_asset: pricingAsset,
    digest_algorithm: 'sha384',
    title: `Schema ${id}`,
    description: 'Pricing gate fixture',
    archived: null,
  }
}

async function installSchemaStubs(page: Page) {
  await page.route(`**/v4/credential-schema/get/${TU_SCHEMA_ID}`, (route) =>
    route.fulfill({ json: { schema: schema(TU_SCHEMA_ID, 'TU', 'tu') } })
  )
  await page.route(`**/v4/credential-schema/get/${COIN_SCHEMA_ID}`, (route) =>
    route.fulfill({ json: { schema: schema(COIN_SCHEMA_ID, 'COIN', 'uvna') } })
  )
  await page.route(`**/v4/ecosystem/get/${ECOSYSTEM_ID}*`, (route) =>
    route.fulfill({
      json: {
        ecosystem: {
          id: ECOSYSTEM_ID,
          did: ACME_DID,
          corporation_id: ECOSYSTEM_ID,
          created: '2026-09-01T10:00:00Z',
          modified: '2026-09-01T10:00:00Z',
          language: 'en',
          active_version: 1,
          participants: 1,
          active_schemas: 2,
          weight: 0,
          issued: 0,
          verified: 0,
          archived: null,
          versions: [],
        },
      },
    })
  )
  await page.route('**/v4/participant/list*', (route) =>
    route.fulfill({
      json: {
        participants: [
          {
            id: 701,
            schema_id: TU_SCHEMA_ID,
            role: 'ECOSYSTEM',
            did: ACME_DID,
            corporation_id: ECOSYSTEM_ID,
            participant_state: 'ACTIVE',
            op_state: 'VALIDATED',
            validator_participant_id: null,
            effective_from: '2026-09-01T10:30:00Z',
            effective_until: null,
            validation_fees: 2000000,
            issuance_fees: 0,
            verification_fees: 0,
            deposit: 0,
            corporation_available_actions: [],
            validator_available_actions: [],
          },
        ],
      },
    })
  )
  await page.route('**/v4/verifiable-trust/resolve', (route) =>
    route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
  )
}

async function open(page: Page, schemaId: number) {
  await installCorporationStubs(page)
  await installSchemaStubs(page)
  await seedActingCorporation(page, ECOSYSTEM_ID)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  await page.goto(`/participants/${schemaId}`)
}

test('a schema priced in trust units keeps the fee-bearing affordances disabled behind the notice', async ({
  page,
}) => {
  await open(page, TU_SCHEMA_ID)

  const notice = page.getByRole('note')
  await expect(notice).toContainText('Pricing asset not yet supported', { timeout: 15_000 })
  await expect(notice).toContainText('TU (tu)')
  await expect(page.getByRole('button', { name: /New Participant/ })).toBeDisabled()
  await expect(page.getByText(ACME_DID).first()).toBeVisible()
})

test('a schema priced in the native coin carries no notice and keeps its affordances', async ({ page }) => {
  await open(page, COIN_SCHEMA_ID)

  await expect(page.getByRole('button', { name: /New Participant/ })).toBeEnabled({ timeout: 15_000 })
  await expect(page.getByRole('note')).toHaveCount(0)
})
