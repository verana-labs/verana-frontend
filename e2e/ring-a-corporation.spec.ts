import { fromBase64 } from '@cosmjs/encoding'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { connectWallet } from './support/connect'
import {
  ACME_POLICY_ADDRESS,
  GRANTEE,
  OPERATOR_GRANT_MESSAGE_TYPES,
  REPLACEMENT_MEMBER,
  SECOND_OPERATOR,
} from './support/corp-fixtures'
import {
  HARNESS_ADDRESS,
  HARNESS_MNEMONIC,
  installCorporationStubs,
  installEcosystemStubs,
  seedActingCorporation,
  stubEcosystemList,
  stubTrustResolve,
} from './support/corp-stubs'
import { installMockChain } from './support/mock-chain'

const DAY_MS = 86_400_000

function localDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fact(scope: Locator, label: string) {
  return scope.getByText(label, { exact: true }).locator('..')
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test('first-connect chooser, persistence and picker re-scoping', async ({ page }) => {
  await installCorporationStubs(page)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

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
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=proposals')
  await expect(page.getByText('#41')).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: /#41/ }).click()
  await expect(page.getByText('/verana.de.v1.MsgGrantOperatorAuthorization').first()).toBeVisible()
  await expect(page.getByText('No votes recorded.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vote yes' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible()

  await page.getByRole('button', { name: /#41/ }).click()
  await page.getByRole('button', { name: /#42/ }).click()
  await expect(page.getByText('/verana.ec.v1.MsgArchiveEcosystem').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vote yes' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /#42/ }).click()

  await page.getByRole('button', { name: /#40/ }).click()
  await expect(page.getByText('/verana.co.v1.MsgUpdateCorporation').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^Execute\b/ })).toBeHidden()

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
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

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
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
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
  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByText('Governance proposal', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Submit proposal' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await mock.teardown()
})

test('a fresh wallet sees no corporation nav and lands on the wizard', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await expect(page.getByRole('link', { name: 'Corporation' })).toBeHidden()

  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: 'Create Corporation' })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'No corporation' }).click()
  await expect(page.getByRole('menu').getByText('This wallet operates no corporation yet.')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /Create new Corporation/ })).toBeVisible()
})

test('the creation wizard gates each step and confirms the built message before broadcasting', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
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
  await page.getByRole('button', { name: 'Sign & create corporation' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(dialog).toContainText('did:web:new-corp.example')
  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await mock.teardown()
})

test('a missing trust deposit renders the empty state', async ({ page }) => {
  await installCorporationStubs(page, { trustDeposit404: true })
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=deposit')
  await expect(page.getByText('No trust deposit recorded for this corporation yet.')).toBeVisible({ timeout: 15_000 })
})

test('the overview reads unknown for every stat whose source failed', async ({ page }) => {
  await installCorporationStubs(page, { sectionsDown: true })
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation')
  await expect(page.getByText('This section could not be loaded, the rest of the page is unaffected.')).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Unknown', { exact: true })).toHaveCount(3)
  await expect(page.getByText('0 (0 open)')).toBeHidden()
})

test('the corporation page and picker hold at mobile and tablet widths', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

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
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: 'New proposal' }).click()

  const submit = page.getByRole('button', { name: 'Submit proposal' })
  await expect(submit).toBeDisabled()
  await page.getByLabel('Grantee account').fill('cosmos1notverana')
  await expect(submit).toBeDisabled()
  await page.getByLabel('Grantee account').fill(GRANTEE)
  await expect(submit).toBeEnabled()
  await page.getByLabel('Spend limit (VNA)', { exact: true }).fill('0')
  await expect(submit).toBeDisabled()
  await expect(page.getByText('Enter spend limits in VNA, above 0 and with at most 6 decimals.')).toBeVisible()
  await page.getByLabel('Spend limit (VNA)', { exact: true }).fill('5')
  await expect(submit).toBeEnabled()

  await page.getByLabel('Proposal type').selectOption('members')
  await expect(
    page.getByText('Weight 0 removes a member. The proposal replaces only the listed entries.')
  ).toBeVisible()
  const firstMember = page.getByPlaceholder('verana1…').first()
  await firstMember.fill('broken')
  await expect(submit).toBeDisabled()
  await firstMember.fill(REPLACEMENT_MEMBER)
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
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
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

const XSS_CLAIM = '<img src=x onerror="window.__xssRan = true"> <script>window.__xssRan = true</script> **not bold**'
const MARKDOWN_CLAIM = '**bold claim** of the service'

test('a service description claim renders as text or Markdown, never as HTML', async ({ page }) => {
  await installCorporationStubs(page)
  await stubEcosystemList(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  const grid = page.locator('#ecosystems-grid')

  await test.step('remote markup stays visible text', async () => {
    await stubTrustResolve(page, { description: XSS_CLAIM })
    await page.goto('/ecosystems')
    await expect(grid.getByText('Acme Trust Registry').first()).toBeVisible({ timeout: 15_000 })
    await expect(grid).toContainText('<img src=x')
    await expect(grid).toContainText('<script>')
    await expect(grid).toContainText('**not bold**')
    await expect(grid.locator('img[src="x"]')).toHaveCount(0)
    await expect(grid.locator('script')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __xssRan?: boolean }).__xssRan)).toBeUndefined()
  })

  await test.step('text/markdown renders as Markdown', async () => {
    await stubTrustResolve(page, { description: MARKDOWN_CLAIM, descriptionFormat: 'text/markdown' })
    await page.goto('/ecosystems')
    await expect(grid.locator('strong').first()).toHaveText('bold claim', { timeout: 15_000 })
    await expect(grid).not.toContainText('**bold claim**')
  })

  for (const descriptionFormat of ['text/plain', 'markdown']) {
    await test.step(`${descriptionFormat} keeps the Markdown literal`, async () => {
      await stubTrustResolve(page, { description: MARKDOWN_CLAIM, descriptionFormat })
      await page.goto('/ecosystems')
      await expect(grid).toContainText('**bold claim**', { timeout: 15_000 })
      await expect(grid.locator('strong')).toHaveCount(0)
    })
  }
})

test('an operator row shows its spend limit, expiration and matching fee grant', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=operators')
  const row = page.locator('#operators li').filter({ hasText: SECOND_OPERATOR })
  const toggle = row.getByRole('button', { name: new RegExp(SECOND_OPERATOR) })
  await expect(toggle).toContainText('23 message types · 5 VNA every 30d · Fee grant', { timeout: 15_000 })
  await expect(
    page.locator('#operators li').filter({ hasText: HARNESS_ADDRESS }).getByRole('button').first()
  ).not.toContainText('Fee grant')

  await toggle.click()
  await expect(fact(row, 'Spend limit')).toContainText('5 VNA')
  await expect(fact(row, 'Remaining spend')).toContainText('3.5 VNA')
  await expect(fact(row, 'Period')).toContainText('30d')
  const cycleEnd = await page.evaluate((iso) => new Date(iso).toLocaleString(), '2026-12-01T00:00:00Z')
  await expect(fact(row, 'Spend cycle ends')).toContainText(cycleEnd)
  await expect(fact(row, 'Fee grant')).toContainText('Yes')
  await expect(fact(row, 'Fee spend limit')).toContainText('2 VNA')
  await expect(fact(row, 'Fee remaining')).toContainText('1.25 VNA')
  await expect(fact(row, 'Fee period')).toContainText('7d')
  await expect(fact(row, 'Fee grant covers')).toContainText('The same 23 message types')

  await page.route('**/v4/delegation/fee-grants*', (route) =>
    route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )
  await page.reload()
  await expect(toggle).toContainText('23 message types · 5 VNA every 30d', { timeout: 15_000 })
  await expect(toggle).not.toContainText('Fee grant')
  await toggle.click()
  await expect(fact(row, 'Remaining spend')).toContainText('3.5 VNA')
  await expect(row.getByText('This section could not be loaded, the rest of the page is unaffected.')).toBeVisible()
})

test('a grant with an expiration, spend limits and a fee grant confirms and broadcasts that message', async ({
  page,
}) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation?tab=operators')
  await page.getByLabel('Grant operator authorization').fill(GRANTEE)
  await page.getByRole('button', { name: 'Expiration, spend limits and fee grant' }).click()
  const grant = page.getByRole('button', { name: /Grant$/ })

  const spendLimit = page.getByLabel('Spend limit (VNA)', { exact: true })
  const period = page.getByLabel('Period (days)', { exact: true })
  await spendLimit.fill('1')
  await period.fill('3')
  await spendLimit.fill('')
  await expect(period).toHaveValue('')
  await expect(period).toBeDisabled()

  await spendLimit.fill('5')
  await period.fill('30')
  await expect(grant).toBeDisabled()
  await expect(page.getByText('A period needs an expiration date, which ends the first period.')).toBeVisible()

  const expiration = localDateTimeInput(new Date(Date.now() + 60 * DAY_MS))
  await page.getByLabel('Expiration', { exact: true }).fill(expiration)
  await page.getByRole('checkbox', { name: /network fees/ }).check()
  await page.getByLabel('Fee spend limit (VNA)', { exact: true }).fill('2')
  await page.getByLabel('Fee period (days)', { exact: true }).fill('7')
  await expect(grant).toBeEnabled()
  await grant.click()

  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(dialog).toContainText('for 23 message types')
  await expect(fact(dialog, 'Spend limit')).toContainText('5 VNA every 30d')
  await expect(fact(dialog, 'Expiration')).toContainText(
    await page.evaluate((value) => new Date(value).toLocaleString(), expiration)
  )
  await expect(fact(dialog, 'Fee grant')).toContainText('2 VNA every 7d')
  await expect(fact(dialog, 'Network fee')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBe(1)

  const body = TxBody.decode(TxRaw.decode(fromBase64(mock.broadcastTxs()[0])).bodyBytes)
  expect(body.messages.map((message) => message.typeUrl)).toEqual(['/verana.de.v1.MsgGrantOperatorAuthorization'])
  expect(MsgGrantOperatorAuthorization.decode(body.messages[0].value)).toEqual({
    corporation: ACME_POLICY_ADDRESS,
    operator: wallet.bech32Address,
    grantee: GRANTEE,
    msgTypes: OPERATOR_GRANT_MESSAGE_TYPES,
    expiration: new Date(expiration),
    authzSpendLimit: [{ denom: 'uvna', amount: '5000000' }],
    authzSpendLimitPeriod: { seconds: 30 * 86_400, nanos: 0 },
    withFeegrant: true,
    feegrantSpendLimit: [{ denom: 'uvna', amount: '2000000' }],
    feegrantSpendLimitPeriod: { seconds: 7 * 86_400, nanos: 0 },
  })
  await expect(page.getByLabel('Grant operator authorization')).toHaveValue('', { timeout: 45_000 })
  const optionsToggle = page.getByRole('button', { name: 'Expiration, spend limits and fee grant' })
  if ((await optionsToggle.getAttribute('aria-expanded')) !== 'true') await optionsToggle.click()
  await expect(page.getByLabel('Expiration', { exact: true })).toHaveValue('')
  await expect(spendLimit).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: /network fees/ })).not.toBeChecked()
  await mock.teardown()
})

test('a re-grant keeps the current fee grant unless turned off, and then warns that it is revoked', async ({
  page,
}) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation?tab=operators')
  const grantee = page.getByLabel('Grant operator authorization')
  const grant = page.getByRole('button', { name: /Grant$/ })
  await grantee.fill(HARNESS_ADDRESS)
  await expect(grant).toBeDisabled()
  await expect(
    page.getByText('You cannot grant yourself while signing as operator, use a group proposal instead.')
  ).toBeVisible()

  await grantee.fill(SECOND_OPERATOR)
  const feeGrant = page.getByRole('checkbox', { name: /network fees/ })
  await expect(feeGrant).toBeChecked()
  await expect(page.getByLabel('Fee spend limit (VNA)', { exact: true })).toHaveValue('2')
  await expect(page.getByLabel('Fee period (days)', { exact: true })).toHaveValue('7')
  const warning = page.getByText(
    'This account already has a fee grant from the corporation. Granting without one revokes it.'
  )
  await expect(warning).toBeHidden()

  await feeGrant.uncheck()
  await expect(warning).toBeVisible()
  await expect(grant).toBeEnabled()
  await grant.click()

  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(fact(dialog, 'Fee grant')).toContainText('Revoked, the current fee grant is removed')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await expect(grantee).toHaveValue(SECOND_OPERATOR)
  await mock.teardown()
})
