import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { ACME_DID, HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'
import { labelInput, labelSelect, labelTextarea } from './support/forms'
import { installMockChain } from './support/mock-chain'

const VALIDITY_FIELDS = [
  'Issuer Grantor Validity Period',
  'Verifier Grantor Validity Period',
  'Issuer Validity Period',
  'Verifier Validity Period',
  'Holder Validity Period',
]

async function installEcosystemStubs(page: Page) {
  await page.route('**/v4/ecosystem/get/13', (route) =>
    route.fulfill({
      json: {
        ecosystem: {
          id: 13,
          did: ACME_DID,
          corporation_id: 13,
          created: '2026-09-01T10:30:00Z',
          modified: '2026-09-01T10:30:00Z',
          archived: null,
          language: 'en',
          active_version: 1,
          versions: [
            {
              id: 1,
              version: 1,
              active_since: '2026-09-01T10:30:00Z',
              documents: [{ id: 1, url: 'https://acme-trust.ch/egf.md', language: 'en', digest_sri: 'sha384-acme' }],
            },
          ],
          participants: 0,
          active_schemas: 0,
          weight: 0,
          issued: 0,
          verified: 0,
        },
      },
    })
  )
  await page.route('**/v4/credential-schema/list*', (route) => route.fulfill({ json: { schemas: [] } }))
}

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
