import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import {
  CGF_DIGEST,
  CGF_DRAFT_URL,
  CGF_MARKDOWN,
  CGF_URL,
  HARNESS_MNEMONIC,
  installCorporationStubs,
  seedActingCorporation,
} from './support/corp-stubs'

const MARKDOWN_HEADERS = { 'access-control-allow-origin': '*', 'content-type': 'text/markdown; charset=utf-8' }

async function stubDocument(page: Page, url: string, body: string) {
  await page.route(url, (route) => route.fulfill({ status: 200, headers: MARKDOWN_HEADERS, body }))
}

async function openGovernanceTab(page: Page) {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  await page.goto('/corporation?tab=governance')
  await expect(page.getByRole('heading', { name: 'Governance Framework (CGF)' })).toBeVisible({ timeout: 15_000 })
  return page.locator('#governance')
}

async function viewActiveDocument(page: Page) {
  const section = await openGovernanceTab(page)
  await section.getByRole('button', { name: 'View' }).first().click()
  return section
}

test('the governance tab lists CGF versions, documents and the delegable actions', async ({ page }) => {
  const section = await openGovernanceTab(page)

  const tabs = page.locator('nav').filter({ has: page.getByRole('button', { name: 'Overview', exact: true }) })
  await expect(tabs.getByRole('button')).toHaveText([
    'Overview',
    'Members',
    'Trust Deposit',
    'Operators',
    'Governance',
    /^Proposals/,
  ])

  await expect(section.getByText('Active version 1')).toBeVisible()
  await expect(section.getByText(CGF_URL)).toBeVisible()
  await expect(section.getByText(CGF_DRAFT_URL)).toBeVisible()
  await expect(section.getByText(/^Active since/)).toBeVisible()
  await expect(section.getByText('Draft', { exact: true })).toBeVisible()

  const activate = section.getByRole('button', { name: /Activate version 2/ })
  await expect(activate).toBeVisible()
  await expect(activate.getByLabel('Opens a governance proposal')).toBeVisible()

  const target = section.getByLabel('Target version')
  await expect(target).toHaveValue('2')
  await expect(target.locator('option')).toHaveText(['Version 2 (draft)', 'Version 3 (new)'])

  const add = section.getByRole('button', { name: 'Add document' })
  await expect(add).toBeDisabled()
  await expect(add.getByLabel('Opens a governance proposal')).toBeVisible()
  await section.getByLabel('Document URL').fill('https://acme-trust.ch/cgf-v3.md')
  await expect(add).toBeDisabled()
})

test('a document whose bytes match the on-chain digest renders as verified', async ({ page }) => {
  await stubDocument(page, CGF_URL, CGF_MARKDOWN)
  const section = await viewActiveDocument(page)

  await expect(section.getByRole('status')).toHaveText('Verified')
  await expect(section.getByRole('heading', { name: 'Acme Trust AG governance framework' })).toBeVisible()
  await expect(section.getByText(`Digest: ${CGF_DIGEST}`)).toBeVisible()
  await expect(section.getByLabel('Document language')).toBeVisible()
  await expect(section.getByRole('button', { name: 'Download' })).toBeVisible()
})

test('a document that does not match its digest is reported and never rendered', async ({ page }) => {
  await stubDocument(page, CGF_URL, '# Tampered\n\nThis is not the registered text.\n')
  const section = await viewActiveDocument(page)

  await expect(section.getByRole('status')).toHaveText('Digest mismatch')
  await expect(section.getByText(/does not match its on-chain digest/)).toBeVisible()
  await expect(section.getByText('Tampered')).toBeHidden()
  await expect(section.getByRole('button', { name: 'Download' })).toBeHidden()
})

test('a document the browser cannot fetch is verified through the server route', async ({ page }) => {
  await page.route(CGF_URL, (route) => route.abort('failed'))
  await page.route('**/api/verified-fetch**', (route) =>
    route.fulfill({ status: 200, headers: { 'content-type': 'text/markdown' }, body: CGF_MARKDOWN })
  )
  const section = await viewActiveDocument(page)

  await expect(section.getByRole('status')).toHaveText('Verified')
  await expect(section.getByRole('heading', { name: 'Acme Trust AG governance framework' })).toBeVisible()
})

test('a document that neither the browser nor the server can verify is reported as unverified', async ({ page }) => {
  await page.route(CGF_URL, (route) => route.abort('failed'))
  await page.route('**/api/verified-fetch**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Upstream fetch failed: boom' } })
  )
  const section = await viewActiveDocument(page)

  await expect(section.getByRole('status')).toHaveText('Could not verify')
  await expect(section.getByText(/could not be verified against its on-chain digest/)).toBeVisible()
  await expect(section.getByText('Upstream fetch failed: boom')).toBeVisible()
  await expect(section.getByRole('button', { name: 'Download' })).toBeHidden()
})
