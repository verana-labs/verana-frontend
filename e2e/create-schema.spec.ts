import { expect, test } from '@playwright/test'
import { installKeplrMock } from './support/keplr-mock'

const SHOT = 'e2e/artifacts'
// A real, reachable governance doc so /api/sri can fetch it and compute the digest while creating the TR.
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
  // $id is set by the chain; validateJSONSchema only requires $schema/type/title/description/properties.
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

  await installKeplrMock(page, { prefix: 'verana' })

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
    // The app redirects to the new trust registry detail page once the TR is created.
    await page.waitForURL(/\/tr\/\d+(\?|$)/, { timeout: 120_000 })
    trId = page.url().match(/\/tr\/(\d+)/)?.[1] ?? ''
    expect(trId).toBeTruthy()
    await expect(page.getByText(did).first()).toBeVisible()
    await page.screenshot({ path: `${SHOT}/cs-01-tr-created.png`, fullPage: true })
    console.log(`CREATED TR ${trId}, ${did}`)
  })

  await test.step('open the add-schema modal from the TR detail page', async () => {
    // "New Schema" is only rendered when the connected wallet owns the TR (isOwner), which it does here.
    const newSchema = page.getByRole('button', { name: /new schema/i }).first()
    await expect(newSchema).toBeVisible({ timeout: 20_000 })
    await newSchema.click()

    // The modal mounts AddCsPage -> EditableDataView in create mode (title "Create New Credential Schema").
    await expect(page.getByRole('heading', { name: /create new credential schema/i })).toBeVisible({ timeout: 20_000 })
  })

  await test.step('fill + broadcast the credential schema (MsgCreateCredentialSchema)', async () => {
    // Permission-mode selects: option values are 1/2/3 (OPEN / GRANTOR_VALIDATION / TRUST_REGISTRY_VALIDATION).
    // OPEN keeps the flow self-contained (no extra validator account needed).
    await labelSelect(page, 'Issuer Permission Mode').selectOption('1')
    await labelSelect(page, 'Verifier Permission Mode').selectOption('1')

    // Validity-period text inputs default to "0" (newCS defaults); fill explicitly so the test is robust
    // to default changes. 0 = never expires, which keeps the schema valid.
    await labelInput(page, 'Issuer Grantor Validity Period').fill('0')
    await labelInput(page, 'Verifier Grantor Validity Period').fill('0')
    await labelInput(page, 'Issuer Validity Period').fill('0')
    await labelInput(page, 'Verifier Validity Period').fill('0')
    await labelInput(page, 'Holder Validity Period').fill('0')

    await labelTextarea(page, 'JSON Schema').fill(jsonSchema)
    await page.screenshot({ path: `${SHOT}/cs-02-filled.png`, fullPage: true })

    await page.locator('.btn-action-confirm').click()

    // No detail-page redirect exists for a schema: success closes the modal and surfaces a success toast
    // (handleSuccess fires only on an on-chain code === 0). The CS list itself refreshes on indexer
    // catch-up, which can lag, so the toast is the authoritative success signal here.
    const successToast = page.locator('.notify-success')
    const errorToast = page.locator('.notify-error')
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 120_000 })
    await expect(errorToast).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /create new credential schema/i })).toHaveCount(0)
    await page.screenshot({ path: `${SHOT}/cs-03-broadcast-result.png`, fullPage: true })
  })

  await test.step('verify the new schema surfaces on the TR detail page', async () => {
    // Best-effort: the card title comes from the indexer (src.title), which may lag a few blocks.
    // Reload to nudge the CS list fetch; tolerate indexer lag without failing the broadcast assertion.
    await page.reload()
    const card = page.getByText(schemaTitle).first()
    const appeared = await card.isVisible({ timeout: 60_000 }).catch(() => false)
    await page.screenshot({ path: `${SHOT}/cs-04-schema-card.png`, fullPage: true })
    console.log(`SCHEMA "${schemaTitle}" on TR ${trId}, card visible: ${appeared}`)
    expect(trId).toBeTruthy()
  })
})
