import { fromBase64 } from '@cosmjs/encoding'
import { expect, type Page, test } from '@playwright/test'
import { MsgAddGovernanceFrameworkDocument } from '@verana-labs/verana-types/codec/verana/gf/v1/tx'
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { connectWallet } from './support/connect'
import {
  ACME_POLICY_ADDRESS,
  CGF_ACTIVE_13,
  cgfVersion,
  EGF_ACTIVE_13,
  EGF_DRAFT_13,
  GRANTEE,
  REPLACEMENT_MEMBER,
} from './support/corp-fixtures'
import {
  HARNESS_MNEMONIC,
  installCorporationStubs,
  installEcosystemStubs,
  seedActingCorporation,
  stubCorporationGovernance,
  stubEcosystemList,
  stubTrustResolve,
} from './support/corp-stubs'
import { labelInput, labelSelect } from './support/forms'
import { installMockChain } from './support/mock-chain'

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
  await installEcosystemStubs(page, [EGF_ACTIVE_13, EGF_DRAFT_13])
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

  const increase = page.getByRole('button', { name: /Increase Active EGF/ })
  await expect(increase).toBeEnabled()
  await expect(increase.getByLabel('Opens a governance proposal')).toBeVisible()
  await page.getByRole('button', { name: /Add New EGF Document/ }).click()
  await expect(labelSelect(page, 'Governance Framework Version').locator('option:not([disabled])')).toHaveText([
    'Version 2 (draft)',
    'Version 3 (new)',
  ])
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

test('a confirmed creation continues to the operator grant step', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubCorporation: false })
  await page.goto('/corporation')

  await page.getByLabel('Corporation DID').fill('did:web:new-corp.example')
  await page.getByLabel('CGF document URL').fill('https://example.com/cgf.pdf')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Sign & create corporation' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBeGreaterThan(0)

  await expect(page.getByText('Corporation created:')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Grant me operator authorization' })).toBeVisible()
  await mock.teardown()
})

test('a cancelled creation leaves the wizard through the sidebar', async ({ page }) => {
  await seedActingCorporation(page, 13)
  await installCorporationStubs(page)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubCorporation: false })
  await page.goto('/corporation?create=1')

  await page.getByLabel('Corporation DID').fill('did:web:new-corp.example')
  await page.getByLabel('CGF document URL').fill('https://example.com/cgf.pdf')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Sign & create corporation' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await page.locator('a[href="/corporation"]').first().click()
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Create Corporation' })).toBeHidden()
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

test('the governance tab lists the CGF versions and gates the increase on the primary language', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation?tab=governance')
  const section = page.locator('#governance')
  await expect(section.getByText('Active version: 1')).toBeVisible({ timeout: 15_000 })
  await expect(section.getByRole('link', { name: 'https://acme-trust.ch/cgf-v1-de.md' })).toBeVisible()
  await expect(section.getByRole('link', { name: 'https://acme-trust.ch/cgf-v2-en.md' })).toBeVisible()
  await expect(section.getByText('Draft', { exact: true })).toBeVisible()
  await expect(
    section.getByRole('button', { name: /Add New CGF Document/ }).getByLabel('Opens a governance proposal')
  ).toBeVisible()

  const increase = section.getByRole('button', { name: /Increase Active CGF/ })
  await expect(increase).toBeDisabled()
  await expect(increase).toHaveAttribute(
    'title',
    /^Version 2 needs a document in .*\(de\) before it can be activated\.$/
  )

  await stubCorporationGovernance(page, [CGF_ACTIVE_13, cgfVersion(13, 31, 2, null, ['en', 'de'])])
  await page.reload()
  await expect(increase).toBeEnabled({ timeout: 15_000 })
  await increase.click()

  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toContainText('Activate the next governance framework version of corporation #13.', {
    timeout: 30_000,
  })
  await expect(dialog.getByText('Governance proposal', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await mock.teardown()
})

test('adding a CGF document proposes the exact message with no ecosystem id', async ({ page }) => {
  const docUrl = 'https://acme-trust.ch/cgf-v2-de.md'
  const digest = 'sha384-S8zSx8Po4dAMgxTyw/W2fksmPVbEwSZpNS/UqbSIKNGK7OUbRviXrBoM6PaJVIAg'
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })
  const digestRequests: (string | null)[] = []
  await page.route('**/api/sri**', (route) => {
    digestRequests.push(new URL(route.request().url()).searchParams.get('url'))
    return route.fulfill({ json: { sri: digest } })
  })

  await page.goto('/corporation?tab=governance')
  await page
    .locator('#governance')
    .getByRole('button', { name: /Add New CGF Document/ })
    .click({ timeout: 15_000 })
  const version = labelSelect(page, 'Governance Framework Version')
  await expect(version.locator('option:not([disabled])')).toHaveText(['Version 2 (draft)', 'Version 3 (new)'])
  await expect(version).toHaveValue('2')
  await page.getByPlaceholder(/search languages/i).fill('German')
  await page.getByRole('option', { name: /\(de\)$/ }).click()
  await labelInput(page, 'Governance Framework Document URL').fill(docUrl)
  await page.locator('.btn-action-confirm').click()

  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toContainText('Add a governance framework document as version 2 of corporation #13.', {
    timeout: 30_000,
  })
  await expect(dialog.getByText('Governance proposal', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Submit proposal' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBe(1)

  expect(digestRequests).toEqual([docUrl])
  const body = TxBody.decode(TxRaw.decode(fromBase64(mock.broadcastTxs()[0])).bodyBytes)
  expect(body.messages.map((message) => message.typeUrl)).toEqual(['/cosmos.group.v1.MsgSubmitProposal'])
  const proposal = MsgSubmitProposal.decode(body.messages[0].value)
  expect(proposal.groupPolicyAddress).toBe(ACME_POLICY_ADDRESS)
  expect(proposal.proposers).toEqual([wallet.bech32Address])
  expect(proposal.messages.map((message) => message.typeUrl)).toEqual([
    '/verana.gf.v1.MsgAddGovernanceFrameworkDocument',
  ])
  expect(MsgAddGovernanceFrameworkDocument.decode(proposal.messages[0].value)).toEqual({
    corporation: ACME_POLICY_ADDRESS,
    operator: ACME_POLICY_ADDRESS,
    ecosystemId: 0,
    docLanguage: 'de',
    docUrl,
    docDigestSri: digest,
    version: 2,
  })
  await mock.teardown()
})
