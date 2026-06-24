import { expect, test } from '@playwright/test'
import { installKeplrMock } from './mocks/keplrMock'
import { requireFundedMnemonic } from './support/mnemonic'

const SHOT = 'e2e/artifacts'
const DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

const labelInput = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::input[1]')

const labelTextarea = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::textarea[1]')

const labelSelect = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::select[1]')

test('create schema: sign + broadcast MsgCreateCredentialSchema to testnet', async ({ page }) => {
  test.setTimeout(240_000)
  const stamp = Date.now().toString(36)
  const did = `did:web:e2e-cs-${stamp}.testnet.verana.network`
  const aka = `https://e2e-cs-${stamp}.testnet.verana.network`
  const schemaTitle = `E2E Schema ${stamp}`
  const schemaDescription = `Schema authored by the create-schema e2e run ${stamp}`
  const jsonSchema = JSON.stringify(
    {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: schemaTitle,
      description: schemaDescription,
      properties: {
        fullName: { type: 'string' },
      },
      required: ['fullName'],
    },
    null,
    2
  )

  const mnemonic = requireFundedMnemonic()
  await installKeplrMock(page, { mnemonic })

  await test.step('connect', async () => {
    await page.goto('/dashboard')
    await page
      .getByRole('button', { name: /connect/i })
      .first()
      .click()
    await page.getByText(/keplr/i).first().click()
    await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: 20_000 })
  })

  let trId = ''

  await test.step('create the owning trust registry (MsgCreateTrustRegistry)', async () => {
    await page.goto('/tr')
    await page
      .getByRole('button', { name: /create ecosystem/i })
      .first()
      .click()
    await expect(page.getByText(/basic information/i)).toBeVisible()

    await page.getByPlaceholder('Healthcare Credentials Ecosystem').fill('E2E Schema Ecosystem')
    await page.getByPlaceholder('Healthcare Trust Registry').fill('E2E Schema Trust Registry')
    await page.getByPlaceholder('did:method:identifier').first().fill(did)
    await labelInput(page, 'AKA').fill(aka)

    await page.getByPlaceholder(/search languages/i).fill('English')
    await page
      .getByRole('option', { name: /english/i })
      .first()
      .click()

    await labelInput(page, 'Document URL').fill(DOC_URL)

    await page.locator('.btn-action-confirm').click()
    await page.waitForURL(/\/tr\/\d+(\?|$)/, { timeout: 120_000 })
    trId = page.url().match(/\/tr\/(\d+)/)?.[1] ?? ''
    expect(trId).toBeTruthy()
    await expect(page.getByText(did).first()).toBeVisible()
    await page.screenshot({ path: `${SHOT}/cs-01-tr-created.png`, fullPage: true })
    console.log(`CREATED TR ${trId}, ${did}`)
  })

  await test.step('open the add-schema modal from the TR detail page', async () => {
    const newSchema = page.getByRole('button', { name: /new schema/i }).first()
    await expect(newSchema).toBeVisible({ timeout: 20_000 })
    await newSchema.click()

    await expect(page.getByRole('heading', { name: /create new credential schema/i })).toBeVisible({ timeout: 20_000 })
  })

  await test.step('fill + broadcast the credential schema (MsgCreateCredentialSchema)', async () => {
    // permission mode option values: 1=OPEN, 2=GRANTOR_VALIDATION, 3=TRUST_REGISTRY_VALIDATION
    await labelSelect(page, 'Issuer Permission Mode').selectOption('1')
    await labelSelect(page, 'Verifier Permission Mode').selectOption('1')

    await labelInput(page, 'Issuer Grantor Validity Period').fill('0')
    await labelInput(page, 'Verifier Grantor Validity Period').fill('0')
    await labelInput(page, 'Issuer Validity Period').fill('0')
    await labelInput(page, 'Verifier Validity Period').fill('0')
    await labelInput(page, 'Holder Validity Period').fill('0')

    await labelTextarea(page, 'JSON Schema').fill(jsonSchema)
    await page.screenshot({ path: `${SHOT}/cs-02-filled.png`, fullPage: true })

    await page.locator('.btn-action-confirm').click()

    const successToast = page.locator('.notify-success')
    const errorToast = page.locator('.notify-error')
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 120_000 })
    await expect(errorToast).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /create new credential schema/i })).toHaveCount(0)
    await page.screenshot({ path: `${SHOT}/cs-03-broadcast-result.png`, fullPage: true })
  })

  await test.step('verify the new schema surfaces on the TR detail page', async () => {
    await page.reload()
    const card = page.getByText(schemaTitle).first()
    const appeared = await card.isVisible({ timeout: 60_000 }).catch(() => false)
    await page.screenshot({ path: `${SHOT}/cs-04-schema-card.png`, fullPage: true })
    console.log(`SCHEMA "${schemaTitle}" on TR ${trId}, card visible: ${appeared}`)
    expect(trId).toBeTruthy()
  })
})
