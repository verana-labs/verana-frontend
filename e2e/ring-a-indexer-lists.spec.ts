import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import {
  HARNESS_MNEMONIC,
  installCorporationStubs,
  installEcosystemListStubs,
  seedActingCorporation,
} from './support/corp-stubs'

const SCOPED_NOTE = 'Filters and sorting apply to the loaded results only.'

test('the ecosystem list pages with keyset cursors and scopes its filters to the loaded window', async ({ page }) => {
  await installCorporationStubs(page)
  const lists = await installEcosystemListStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/ecosystems')
  const cards = page.locator('#ecosystems-grid [role="button"]')
  await expect(cards).toHaveCount(9, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Eco 12 Registry' })).toBeVisible()
  await expect(page.locator('[data-membership="controlled"]').first()).toBeVisible()
  await expect(page.getByText(SCOPED_NOTE)).toBeVisible()
  await expect(page.getByText('9 loaded')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(cards).toHaveCount(2)
  await expect(page.getByText('2 loaded')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
  await expect(page.locator('[data-membership="joined"]')).toHaveCount(1)
  expect(lists.listRequests().some((search) => search.includes('sort=-id') && search.includes('max_id=4'))).toBe(true)

  await page.getByLabel('Membership').selectOption('controlled')
  await expect(cards).toHaveCount(1)
  await page.getByLabel('Membership').selectOption('joined')
  await expect(cards).toHaveCount(1)
  await page.getByLabel('Membership').selectOption('all')

  await page.getByRole('button', { name: 'Previous page' }).click()
  await expect(cards).toHaveCount(9)
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  expect(lists.listRequests().some((search) => search.includes('sort=%2Bid') && search.includes('min_id=4'))).toBe(true)

  await page.getByLabel('Membership').selectOption('joined')
  await expect(page.getByText('No ecosystems match your filters.')).toBeVisible()
  await expect(page.getByText(SCOPED_NOTE)).toBeVisible()

  expect(lists.resolvedDids().filter((did) => did.startsWith('did:web:eco-'))).toEqual([])
})

test('discover orders trusted ecosystems first from the inline trust data and pages the loaded window', async ({
  page,
}) => {
  const lists = await installEcosystemListStubs(page)

  await page.goto('/discover')
  const headings = page.locator('#ecosystem-list h2')
  await expect(headings).toHaveText(['Eco 12 Registry', 'Eco 10 Registry', 'Eco 8 Registry'], { timeout: 15_000 })
  await expect(page.getByText(SCOPED_NOTE)).toBeVisible()
  await expect(page.getByText('5 loaded')).toBeVisible()

  await page.getByLabel('Show untrusted ecosystems').check()
  await expect(headings).toHaveText([
    'Eco 12 Registry',
    'Eco 10 Registry',
    'Eco 8 Registry',
    'did:web:eco-11.example',
    'did:web:eco-9.example',
  ])

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(headings).toHaveText([
    'Eco 6 Registry',
    'Eco 4 Registry',
    'did:web:eco-7.example',
    'did:web:eco-5.example',
    'did:web:eco-3.example',
  ])
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled()

  expect(lists.resolvedDids()).toEqual([])
})

test('a list that fits one window shows neither the pager nor the loaded-window note', async ({ page }) => {
  await installCorporationStubs(page)
  await installEcosystemListStubs(page, { count: 5 })
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/ecosystems')
  await expect(page.locator('#ecosystems-grid [role="button"]')).toHaveCount(4, { timeout: 15_000 })
  await expect(page.getByText(SCOPED_NOTE)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Next page' })).toBeHidden()
})
