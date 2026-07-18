import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { createEcosystem } from './support/flows'
import { labelInput, labelSelect, labelTextarea } from './support/forms'
import { requireFundedMnemonic } from './support/mnemonic'

const VALIDITY_FIELDS = [
  'Issuer Grantor Validity Period',
  'Verifier Grantor Validity Period',
  'Issuer Validity Period',
  'Verifier Validity Period',
  'Holder Validity Period',
]

test('create a credential schema (real devnet broadcast)', async ({ page }) => {
  test.setTimeout(240_000)
  await connectWallet(page, { mnemonic: requireFundedMnemonic() })

  const stamp = randomUUID().replace(/-/g, '').slice(0, 8)
  const did = `did:web:e2e-cs-${stamp}.devnet.verana.network`
  const ecosystemId = await createEcosystem(page, { did })

  const schemaTitle = `E2E Schema ${stamp}`
  const jsonSchema = JSON.stringify(
    {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: schemaTitle,
      description: `Schema authored by the create-schema e2e run ${stamp}`,
      properties: { fullName: { type: 'string' } },
      required: ['fullName'],
    },
    null,
    2
  )

  await page
    .getByRole('button', { name: /new schema/i })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: /create new credential schema/i })).toBeVisible({ timeout: 20_000 })

  await labelSelect(page, 'Issuer Onboarding Mode').selectOption('1')
  await labelSelect(page, 'Verifier Onboarding Mode').selectOption('1')
  for (const field of VALIDITY_FIELDS) await labelInput(page, field).fill('0')
  await labelTextarea(page, 'JSON Schema').fill(jsonSchema)

  await page.locator('.btn-action-confirm').click()

  const successToast = page.locator('.notify-success')
  const errorToast = page.locator('.notify-error')
  await expect(successToast.or(errorToast)).toBeVisible({ timeout: 120_000 })
  await expect(errorToast).toHaveCount(0)
  console.log(`created schema "${schemaTitle}" on ecosystem ${ecosystemId}`)
})
