import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import {
  dropDiscoveryStubs,
  installCorporationStubs,
  installEcosystemStubs,
  seedActingCorporation,
} from './support/corp-stubs'
import { installMockChain } from './support/mock-chain'

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test('first-connect chooser, persistence and picker re-scoping', async ({ page }) => {
  await installCorporationStubs(page)
  await connectWallet(page)

  await expect(page.getByText('Choose your acting corporation')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /Acme Trust AG/ }).click()
  await expect(page.getByText('Choose your acting corporation')).toBeHidden()

  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toContainText('🇨🇭')
  await expect(page.getByRole('button', { name: /New Corporation/ })).toBeVisible()

  await page
    .getByRole('button', { name: /Acme Trust AG/ })
    .first()
    .click()
  await page.getByRole('menuitem', { name: /did:web:kepl/ }).click()
  await expect(page.getByRole('heading', { name: /did:web:keplr/ })).toBeVisible({ timeout: 15_000 })
  expect(new URL(page.url()).pathname).toBe('/corporation')

  await page.reload()
  await expect(page.getByRole('heading', { name: /did:web:keplr/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Choose your acting corporation')).toBeHidden()
})

test('tabs, deep links and proposal actions', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page)

  await page.goto('/corporation?tab=proposals')
  await expect(page.getByText('#41')).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: /#41/ }).click()
  await expect(page.getByText('/verana.de.v1.MsgGrantOperatorAuthorization').first()).toBeVisible()
  await expect(page.getByText('No votes recorded.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vote yes' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible()

  await page.getByRole('button', { name: /#40/ }).click()
  await expect(page.getByText('/verana.co.v1.MsgUpdateCorporation').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Execute', exact: true })).toBeHidden()

  await page.getByRole('button', { name: 'Members', exact: true }).click()
  await expect(page).toHaveURL(/tab=members/)
  await expect(page.getByText('300s')).toBeVisible()

  await page.getByRole('button', { name: 'Trust Deposit', exact: true }).click()
  const repay = page.getByRole('button', { name: /Repay Slashed Deposit/ })
  await expect(repay).toBeVisible()
  await expect(repay.getByLabel('Executes directly as operator')).toBeVisible()
})

test('a member without grants gets the proposal signing mode everywhere', async ({ page }) => {
  await installCorporationStubs(page, { memberOnly: true })
  await seedActingCorporation(page, 13)
  await connectWallet(page)

  await page.goto('/corporation?tab=operators')
  const grant = page.getByRole('button', { name: /Grant$/ })
  await expect(grant).toBeVisible({ timeout: 15_000 })
  await expect(grant.getByLabel('Opens a governance proposal')).toBeVisible()

  await page.getByRole('button', { name: 'Trust Deposit', exact: true }).click()
  const repay = page.getByRole('button', { name: /Repay Slashed Deposit/ })
  await expect(repay.getByLabel('Opens a governance proposal')).toBeVisible()
})

test('a member without grants gets the proposal fallback on an owned ecosystem', async ({ page }) => {
  await installCorporationStubs(page, { memberOnly: true })
  await installEcosystemStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page)
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/ecosystems/13')
  const archive = page.getByRole('button', { name: /^Archive/ })
  await expect(archive).toBeVisible({ timeout: 15_000 })
  await expect(archive).toBeEnabled()
  await expect(archive.getByLabel('Opens a governance proposal')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^Edit Configuration/ }).getByLabel('Opens a governance proposal')
  ).toBeVisible()

  await archive.click()
  const confirm = page.locator('.btn-action-confirm')
  const dialog = page.getByRole('dialog')
  await expect(confirm.or(dialog)).toBeVisible({ timeout: 30_000 })
  if (await confirm.isVisible()) await confirm.click()
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByText('Governance proposal', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Submit proposal' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await mock.teardown()
})

test('losing the acting corporation mid-session blocks and returns to guest mode', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page)

  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'Ecosystems' })).toBeVisible()

  await dropDiscoveryStubs(page)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))

  await expect(page.getByText(/You can no longer act for/)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Continue without a corporation' }).click()
  await expect(page.getByText(/You can no longer act for/)).toBeHidden()
  await expect(page.getByRole('button', { name: 'No corporation' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ecosystems' })).toBeHidden()
  await expect(page.getByRole('link', { name: 'Corporation' })).toBeHidden()
})

test('a fresh wallet sees no corporation nav and lands on the wizard', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await connectWallet(page)

  await expect(page.getByRole('link', { name: 'Corporation' })).toBeHidden()

  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: 'Create Corporation' })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'No corporation' }).click()
  await expect(page.getByRole('menu').getByText('This wallet operates no corporation yet.')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /Create new Corporation/ })).toBeVisible()
})

test('the creation wizard gates each step on valid input', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  const wallet = await connectWallet(page)
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubCorporation: false })
  await page.goto('/corporation')

  const next = page.getByRole('button', { name: 'Continue' })
  await expect(next).toBeDisabled()

  await page.getByLabel('Corporation DID').fill('not-a-did')
  await page.getByLabel('CGF document URL').fill('https://example.com/cgf.pdf')
  await expect(next).toBeDisabled()

  await page.getByLabel('Corporation DID').fill('did:web:new-corp.example')
  await expect(next).toBeEnabled()
  await next.click()

  await page.getByRole('button', { name: 'Add member' }).click()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  await page.getByRole('button', { name: 'Remove member' }).click()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByText(/you keep no personal privileges/)).toBeVisible()
  await expect(page.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Sign & create corporation' })).toBeEnabled()
  await mock.teardown()
})

test('a missing trust deposit renders the empty state', async ({ page }) => {
  await installCorporationStubs(page, { trustDeposit404: true })
  await seedActingCorporation(page, 13)
  await connectWallet(page)

  await page.goto('/corporation?tab=deposit')
  await expect(page.getByText('No trust deposit recorded for this corporation yet.')).toBeVisible({ timeout: 15_000 })
})

test('the corporation page and picker hold at mobile and tablet widths', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toBeVisible({ timeout: 15_000 })
  await noHorizontalOverflow(page)

  await page.getByRole('button', { name: /^Proposals/ }).click()
  await expect(page.getByText('#41')).toBeVisible()
  await noHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Open main menu' }).click()
  await page
    .getByRole('button', { name: /Acme Trust AG/ })
    .first()
    .click()
  await expect(page.getByText('Acting corporation')).toBeVisible()

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/corporation?tab=members')
  await expect(page.getByText('300s')).toBeVisible({ timeout: 15_000 })
  await noHorizontalOverflow(page)
})

test('the proposal composer gates each kind on valid input', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page)

  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: 'New proposal' }).click()

  const submit = page.getByRole('button', { name: 'Submit proposal' })
  await expect(submit).toBeDisabled()
  await page.getByLabel('Grantee account').fill('cosmos1notverana')
  await expect(submit).toBeDisabled()
  await page.getByLabel('Grantee account').fill('verana1grantee')
  await expect(submit).toBeEnabled()

  await page.getByLabel('Proposal type').selectOption('members')
  await expect(
    page.getByText('Weight 0 removes a member. The proposal replaces only the listed entries.')
  ).toBeVisible()
  const firstMember = page.getByPlaceholder('verana1…').first()
  await firstMember.fill('broken')
  await expect(submit).toBeDisabled()
  await firstMember.fill('verana1fixedagain')
  await expect(submit).toBeEnabled()

  await page.getByLabel('Proposal type').selectOption('policy')
  await page.getByLabel('Threshold').fill('0')
  await expect(submit).toBeDisabled()
  await page.getByLabel('Threshold').fill('2')
  await expect(submit).toBeEnabled()

  await page.getByLabel('Proposal type').selectOption('rotate')
  await expect(submit).toBeDisabled()
  await page.getByLabel('DID', { exact: true }).fill('did:web:next.example')
  await expect(submit).toBeEnabled()
})

test('a vote opens the confirmation, cancel broadcasts nothing and confirm broadcasts once', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page)
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation?tab=proposals')
  await expect(page.getByText('#41')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /#41/ }).click()
  await page.getByRole('button', { name: 'Vote yes' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Executes as')).toBeVisible()
  await expect(dialog.getByText('Network fee')).toBeVisible()
  await expect(dialog.getByText(/VNA/)).toBeVisible({ timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')

  await page.getByRole('button', { name: 'Vote yes' }).click()
  await expect(dialog.getByText(/VNA/)).toBeVisible({ timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect
    .poll(() => mock.seenMethods().filter((method) => method === 'broadcast_tx_sync').length, { timeout: 30_000 })
    .toBe(1)
  await mock.teardown()
})
