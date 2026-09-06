import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import {
  ACME_DID,
  HARNESS_MNEMONIC,
  installCorporationStubs,
  installEcosystemStubs,
  seedActingCorporation,
} from './support/corp-stubs'
import { labelInput, labelSelect, labelTextarea } from './support/forms'
import { installMockChain } from './support/mock-chain'

const TU_SCHEMA_ID = 77

const VALIDITY_FIELDS = [
  'Issuer Grantor Validity Period',
  'Verifier Grantor Validity Period',
  'Issuer Validity Period',
  'Verifier Validity Period',
  'Holder Validity Period',
]

async function installTrustUnitSchemaStubs(page: Page) {
  await page.route(`**/v4/credential-schema/get/${TU_SCHEMA_ID}`, (route) =>
    route.fulfill({
      json: {
        schema: {
          id: TU_SCHEMA_ID,
          ecosystem_id: 13,
          json_schema: JSON.stringify({ title: 'Trust Unit Credential', description: 'Priced in TU', type: 'object' }),
          issuer_grantor_validation_validity_period: 0,
          verifier_grantor_validation_validity_period: 0,
          issuer_validation_validity_period: 365,
          verifier_validation_validity_period: 365,
          holder_validation_validity_period: 0,
          issuer_onboarding_mode: 'ECOSYSTEM_ONBOARDING_PROCESS',
          verifier_onboarding_mode: 'OPEN',
          holder_onboarding_mode: 'PERMISSIONLESS',
          pricing_asset_type: 'TU',
          pricing_asset: 'tu',
          digest_algorithm: 'sha384',
          title: 'Trust Unit Credential',
          description: 'Priced in TU',
          archived: null,
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
            corporation_id: 13,
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
}

test('a schema priced in trust units keeps the join disabled behind the pricing notice', async ({ page }) => {
  await installCorporationStubs(page)
  await installEcosystemStubs(page)
  await installTrustUnitSchemaStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto(`/participants/${TU_SCHEMA_ID}`)
  const notice = page.getByRole('note')
  await expect(notice).toContainText('Pricing asset not yet supported', { timeout: 15_000 })
  await expect(notice).toContainText('TU (tu)')

  const join = page.getByRole('button', { name: /^join/i }).first()
  await expect(join).toBeVisible()
  await expect(join).toBeDisabled()
  await expect(page.getByRole('button', { name: /New Participant/ })).toBeDisabled()
})

test('the confirmation lists the schema trust deposit next to the network fee', async ({ page }) => {
  test.setTimeout(120_000)
  await installCorporationStubs(page)
  await installEcosystemStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/ecosystems/13')
  await page
    .getByRole('button', { name: /new schema/i })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: /create new credential schema/i })).toBeVisible({ timeout: 20_000 })

  await labelSelect(page, 'Issuer Onboarding Mode').selectOption('1')
  await labelSelect(page, 'Verifier Onboarding Mode').selectOption('1')
  for (const field of VALIDITY_FIELDS) await labelInput(page, field).fill('0')
  await labelTextarea(page, 'JSON Schema').fill(
    JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: 'Ring A Cost Preview',
      description: 'Schema used to preview the trust deposit',
      properties: { fullName: { type: 'string' } },
      required: ['fullName'],
    })
  )
  await page.locator('.btn-action-confirm').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByText('Trust deposit', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Trust deposit', { exact: true }).locator('..')).toContainText(/[1-9][\d.]* VNA/)
  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })

  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await mock.teardown()
})
