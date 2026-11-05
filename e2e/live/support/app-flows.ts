import { randomUUID } from 'node:crypto'
import { expect, type Locator, type Page } from '@playwright/test'
import { labelInput, labelSelect, labelTextarea } from '../../support/forms'
import { connectApp, type LiveSession } from './fixtures'

export const DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

export const newStamp = () => randomUUID().replace(/-/g, '').slice(0, 8)
export const testDid = (kind: string, stamp: string) => `did:web:${kind}-${stamp}.verana-test.example`

export async function ready(live: LiveSession, page: Page, path: string): Promise<string> {
  const address = await connectApp(live, page)
  await page.goto(path)
  return address
}

export async function confirmDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  const confirm = dialog.getByRole('button', { name: /^(confirm|submit proposal)/i })
  await expect(confirm).toBeEnabled({ timeout: 90_000 })
  await confirm.click()
}

export async function submitFormIfShown(page: Page): Promise<void> {
  const confirm = page.locator('.btn-action-confirm').first()
  if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await confirm.click()
}

export async function reloadUntilVisible(page: Page, target: Locator, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (
      await target
        .first()
        .isVisible()
        .catch(() => false)
    )
      return
    await page.waitForTimeout(4_000)
    await page.reload()
  }
  await expect(target.first()).toBeVisible({ timeout: 1_000 })
}

export async function fillFees(page: Page, value = '0'): Promise<void> {
  for (const label of ['Validation Fees (VNA)', 'Issuance Fees (VNA)', 'Verification Fees (VNA)']) {
    const input = labelInput(page, label)
    if (await input.isVisible().catch(() => false)) await input.fill(value)
  }
}

export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

export async function pickLanguage(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder(/search languages/i).fill(name)
  await page
    .getByRole('option', { name: new RegExp(name, 'i') })
    .first()
    .click()
  await page.evaluate(() => new Promise(requestAnimationFrame))
}

export async function openEcosystemForm(page: Page, did: string): Promise<void> {
  await page
    .getByRole('button', { name: /create ecosystem/i })
    .first()
    .click()
  await expect(page.getByText(/basic information/i)).toBeVisible()
  await page.getByPlaceholder('did:method:identifier').first().fill(did)
  await pickLanguage(page, 'English')
  await labelInput(page, 'Document URL').fill(DOC_URL)
}

export async function fillSchemaForm(page: Page, stamp: string, issuerMode: '1' | '2' | '3'): Promise<void> {
  const title = `Live Keplr Schema ${stamp}`
  const jsonSchema = JSON.stringify(
    {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title,
      description: `Schema authored by the live Keplr run ${stamp}`,
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
  await expect(page.getByRole('heading', { name: /create new credential schema/i })).toBeVisible({ timeout: 30_000 })
  await labelSelect(page, 'Issuer Onboarding Mode').selectOption(issuerMode)
  await labelSelect(page, 'Verifier Onboarding Mode').selectOption('1')
  await labelSelect(page, 'Holder Onboarding Mode').selectOption('2')
  await labelSelect(page, 'Digest Algorithm').selectOption('sha384')
  for (const field of [
    'Issuer Grantor Validity Period',
    'Verifier Grantor Validity Period',
    'Issuer Validity Period',
    'Verifier Validity Period',
    'Holder Validity Period',
  ]) {
    await labelInput(page, field).fill('0')
  }
  await labelTextarea(page, 'JSON Schema').fill(jsonSchema)
}

export async function openParticipant(page: Page, schemaId: string, did: string): Promise<void> {
  await page.goto(`/participants/${schemaId}`)
  const row = page.locator('[data-slot="tree-row"]').filter({ hasText: did })
  await reloadUntilVisible(page, row)
  await row.first().click()
}

export async function joinFromTree(page: Page, schemaId: string, rowText: RegExp | string): Promise<void> {
  await page.goto(`/participants/${schemaId}`)
  await page
    .locator('[data-slot="tree-row"]')
    .filter({ hasText: rowText })
    .getByRole('button', { name: /join/ })
    .first()
    .click({ timeout: 30_000 })
  const accept = page.locator('#egf-accept')
  if (await accept.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await expect(accept).toBeEnabled({ timeout: 60_000 })
    await accept.check()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }
}

export function groupProposalRow(page: Page, id: string): Locator {
  return page.getByRole('button', { name: new RegExp(`#${id}\\b`) })
}

export async function composeProposal(
  page: Page,
  kind: 'grant' | 'revoke' | 'members' | 'policy' | 'rotate'
): Promise<void> {
  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: 'New proposal' }).click()
  await page.getByLabel('Proposal type').selectOption(kind)
}
