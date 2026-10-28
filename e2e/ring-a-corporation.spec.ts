import { fromBase64 } from '@cosmjs/encoding'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { MsgAddGovernanceFrameworkDocument } from '@verana-labs/verana-types/codec/verana/gf/v1/tx'
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { connectWallet } from './support/connect'
import {
  ACME_ECOSYSTEM_DID,
  ACME_POLICY_ADDRESS,
  CGF_ACTIVE_13,
  cgfVersion,
  EGF_ACTIVE_13,
  EGF_DRAFT_13,
  GRANTEE,
  HARNESS_GRANTS_13,
  OPERATOR_GRANT_MESSAGE_TYPES,
  REPLACEMENT_MEMBER,
  SECOND_OPERATOR,
  SECOND_OPERATOR_CYCLE_END,
} from './support/corp-fixtures'
import {
  HARNESS_ADDRESS,
  HARNESS_MNEMONIC,
  indexerParticipantEvent,
  installCorporationStubs,
  installEcosystemStubs,
  installIndexerSocket,
  seedActingCorporation,
  stubCorporationGovernance,
  stubEcosystemList,
  stubTrustResolve,
} from './support/corp-stubs'
import { labelInput, labelSelect } from './support/forms'
import { installMockChain } from './support/mock-chain'

const DAY_MS = 86_400_000

const PERCENTAGE_POLICY = {
  '@type': '/cosmos.group.v1.PercentageDecisionPolicy',
  percentage: '0.5',
  windows: { voting_period: '300s', min_execution_period: '3600s' },
}

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
  await expect(page.getByRole('heading', { name: 'Create your corporation' })).toBeHidden()
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

test('switching the acting corporation closes a form opened for the previous one', async ({ page }) => {
  await installCorporationStubs(page)
  await installEcosystemStubs(page, [EGF_ACTIVE_13, EGF_DRAFT_13])
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/ecosystems/13')
  await page.getByRole('button', { name: /^Edit Configuration/ }).click()
  const did = page.getByPlaceholder('did:method:identifier')
  await did.fill('did:web:typed-before-the-switch.example')

  await page
    .getByRole('button', { name: /Acme Trust AG/ })
    .first()
    .click()
  await page.getByRole('menuitem', { name: /Acme Trust AG/ }).click()
  await expect(page.getByRole('menuitem', { name: /Acme Trust AG/ })).toBeHidden()
  await expect(did).toHaveValue('did:web:typed-before-the-switch.example')
  await expect(page.getByRole('button', { name: /Acme Trust AG/ }).first()).toBeVisible()

  await page
    .getByRole('button', { name: /Acme Trust AG/ })
    .first()
    .click()
  await page.getByRole('menuitem', { name: /did:web:kepl/ }).click()
  await expect(page.getByRole('button', { name: /did:web:kepl/ }).first()).toBeVisible({ timeout: 15_000 })
  await expect(did).toBeHidden()

  await page
    .getByRole('button', { name: /did:web:kepl/ })
    .first()
    .click()
  await page.getByRole('menuitem', { name: /Acme Trust AG/ }).click()
  await page.getByRole('button', { name: /^Edit Configuration/ }).click()
  await expect(did).toHaveValue(ACME_ECOSYSTEM_DID)
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

test('a percentage policy shows on the members tab with its minimum execution period', async ({ page }) => {
  await installCorporationStubs(page, { decisionPolicy: PERCENTAGE_POLICY })
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=members')
  const members = page.locator('#members')
  await expect(fact(members, 'Percentage')).toContainText('50%', { timeout: 15_000 })
  await expect(fact(members, 'Minimum execution period')).toContainText('3600s')
  await expect(members.getByText('Threshold', { exact: true })).toBeHidden()

  await page.goto('/corporation?tab=proposals')
  await expect(page.getByText('2 of 6 yes · threshold 50%')).toBeVisible({ timeout: 15_000 })
})

test('an accepted proposal offers Execute on its own once the minimum execution period has passed', async ({
  page,
}) => {
  await installCorporationStubs(page, {
    decisionPolicy: { ...PERCENTAGE_POLICY, windows: { voting_period: '300s', min_execution_period: '20s' } },
  })
  let submitTime: string | undefined
  await page.route('**/v4/group/proposals*', (route) => {
    submitTime ??= new Date().toISOString()
    return route.fulfill({
      json: {
        proposals: [
          {
            id: 50,
            corporation_id: 13,
            status: 'ACCEPTED',
            submit_time: submitTime,
            voting_period_end: submitTime,
            executor_result: 'FAILURE',
            proposers: [HARNESS_ADDRESS],
            messages: [{ '@type': '/verana.co.v1.MsgUpdateCorporation', did: 'did:web:next.example' }],
            tally: { yes_count: '6', no_count: '0', abstain_count: '0', no_with_veto_count: '0' },
          },
        ],
      },
    })
  })
  await page.clock.install()
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: /#50/ }).click()
  await expect(page.getByText(/^Executable from /)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Execute', exact: true })).toBeHidden()
  await page.clock.fastForward(21_000)
  await expect(page.getByRole('button', { name: 'Execute', exact: true })).toBeVisible()
  await expect(page.getByText(/^Executable from /)).toBeHidden()
})

test('an execute that has to wait reads as scheduled, never as executed', async ({ page }) => {
  await installCorporationStubs(page, {
    decisionPolicy: { ...PERCENTAGE_POLICY, windows: { voting_period: '300s', min_execution_period: '20s' } },
  })
  const past = new Date(Date.now() - DAY_MS).toISOString()
  await page.route('**/v4/indexer/block-height', (route) =>
    route.fulfill({ json: { height: 1001, timestamp: '2026-07-18T07:00:00Z' } })
  )
  let proposalFetches = 0
  await page.route('**/v4/group/proposals*', (route) => {
    proposalFetches += 1
    return route.fulfill({
      json: {
        proposals: [
          {
            id: 18,
            corporation_id: 13,
            status: 'ACCEPTED',
            submit_time: past,
            voting_period_end: past,
            executor_result: 'NOT_RUN',
            proposers: [HARNESS_ADDRESS],
            messages: [{ '@type': '/verana.co.v1.MsgUpdateCorporation', did: 'did:web:next.example' }],
            tally: { yes_count: '6', no_count: '0', abstain_count: '0', no_with_veto_count: '0' },
          },
        ],
      },
    })
  })
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, {
    address: wallet.bech32Address,
    stubSri: false,
    stubCorporation: false,
    txEvents: [
      {
        type: 'cosmos.group.v1.EventExec',
        attributes: [
          {
            key: 'logs',
            value: JSON.stringify(
              'must wait until 2026-10-16 14:59:16.914501555 +0000 UTC to execute proposal 18: invalid value'
            ),
            index: true,
          },
          { key: 'proposal_id', value: JSON.stringify('18'), index: true },
          { key: 'result', value: JSON.stringify('PROPOSAL_EXECUTOR_RESULT_FAILURE'), index: true },
        ],
      },
    ],
  })

  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: /#18/ }).click()
  await page.getByRole('button', { name: 'Execute', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/VNA/)).toBeVisible({ timeout: 30_000 })
  const fetchesBeforeConfirm = proposalFetches
  await dialog.getByRole('button', { name: 'Confirm' }).click()

  await expect(page.getByText('Proposal scheduled', { exact: true })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/^Proposal 18 was accepted, it can be executed from /)).toBeVisible()
  await expect(page.getByText('Proposal executed', { exact: true })).toBeHidden()
  await expect.poll(() => proposalFetches).toBeGreaterThan(fetchesBeforeConfirm)
  await mock.teardown()
})

test('a policy update keeps a percentage policy and confirms every change without broadcasting', async ({ page }) => {
  await installCorporationStubs(page, { decisionPolicy: PERCENTAGE_POLICY })
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: 'New proposal' }).click()
  await page.getByLabel('Proposal type').selectOption('policy')
  const kind = page.getByLabel('Decision policy', { exact: true })
  const percent = page.getByLabel('Percentage (%)')
  const minExecution = page.getByLabel('Minimum execution period (seconds)')
  await expect(kind).toHaveValue('percentage')
  await expect(percent).toHaveValue('50')
  await expect(minExecution).toHaveValue('3600')

  const submit = page.getByRole('button', { name: 'Submit proposal' })
  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await percent.fill('60')
  await minExecution.fill('0')
  await submit.click()
  await expect(fact(dialog, 'Percentage')).toContainText('50% → 60%')
  await expect(fact(dialog, 'Voting period')).toContainText('5m')
  await expect(fact(dialog, 'Minimum execution period')).toContainText('1h → 0s')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await kind.selectOption('threshold')
  await page.getByLabel('Threshold').fill('4')
  await submit.click()
  await expect(fact(dialog, 'Decision policy')).toContainText('Percentage 50% → Threshold 4')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.broadcastTxs()).toEqual([])
  await mock.teardown()
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

  await page.getByRole('tab', { name: 'Governance' }).click()
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

  const createCorporation = page.getByRole('link', { name: /Create new Corporation/ })
  await expect(page.getByRole('heading', { name: 'Create your corporation' })).toBeVisible({ timeout: 15_000 })
  const sidebar = page.locator('[data-shell="sidebar"] nav')
  await expect(sidebar.locator('a[href="/account"]')).toBeVisible()
  for (const href of ['/corporation', '/ecosystems', '/agents', '/pendingtasks']) {
    await expect(sidebar.locator(`a[href="${href}"]`)).toHaveCount(0)
  }
  await expect(page.getByText('Acting corporation required')).toBeVisible()

  for (const path of ['/ecosystems', '/pendingtasks']) {
    await page.goto(path)
    await expect(page.getByText('This wallet operates no corporation yet.')).toBeVisible({ timeout: 15_000 })
  }
  await page.goto('/dashboard')

  await createCorporation.click()
  await expect(page.getByRole('heading', { name: 'Create Corporation' })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'No corporation' }).click()
  await expect(page.getByRole('menu').getByText('This wallet operates no corporation yet.')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /Create new Corporation/ })).toBeVisible()
})

test('the create corporation call to action waits for a successful discovery', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/v4/group/corporations-by-member*', async (route) => {
    await released
    await route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  })
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  const callToAction = page.getByRole('heading', { name: 'Create your corporation' })
  await expect(callToAction).toBeHidden()
  await expect(page.getByText('Acting corporation required')).toBeHidden()

  release()
  await expect(page.getByText('Discovery failed', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(callToAction).toBeHidden()

  for (const path of ['/ecosystems', '/pendingtasks', '/agents', '/corporation']) {
    await page.goto(path)
    await expect(page.getByText('Unable to load the corporation.')).toBeVisible({ timeout: 15_000 })
  }
})

test('losing the last corporation blocks with a notice and returns to the dashboard', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/pendingtasks')
  const notice = page.getByText('Corporation no longer available')
  await expect(notice).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/it acts for no other one/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(notice).toBeVisible()
  await page.getByRole('button', { name: 'Continue without a corporation' }).click()

  await expect(notice).toBeHidden()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Create your corporation' })).toBeVisible()
})

test('losing the acting corporation while others remain asks for another one', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 99)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await expect(page.getByText('Choose your acting corporation')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/The corporation you were acting for is no longer available/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue without a corporation' })).toHaveCount(0)
  await page.getByRole('button', { name: /Acme Trust AG/ }).click()
  await expect(page.getByText('Choose your acting corporation')).toBeHidden()
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
  await page.getByLabel('Decision policy').selectOption('percentage')
  await page.getByLabel('Percentage (%)').fill('0')
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  await page.getByLabel('Percentage (%)').fill('66.67')
  await page.getByLabel('Minimum execution period (seconds)').fill('3600')
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByText('66.67% / 60s / 3600s')).toBeVisible()
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

test('operators past the first indexer window are counted and listed', async ({ page }) => {
  await installCorporationStubs(page)
  const filler = Array.from({ length: 1024 }, (_, index) => ({
    id: 5000 - index,
    corporation_id: 13,
    operator: `verana1filler${index}`,
    msg_types: ['/verana.ec.v1.MsgCreateEcosystem'],
  }))
  await page.route('**/v4/delegation/operator-authorizations*', (route) => {
    const params = new URL(route.request().url()).searchParams
    if (params.get('corporation_id') !== '13') return route.fallback()
    expect(params.get('limit')).toBe('1024')
    return params.has('max_id') ? route.fallback() : route.fulfill({ json: { authorizations: filler } })
  })
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation')
  await expect(fact(page.locator('#overview'), 'Operators')).toContainText('1025', { timeout: 15_000 })
  await page.goto('/corporation?tab=operators')
  await expect(page.locator('#operators li').filter({ hasText: SECOND_OPERATOR })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Only the first entries of this list are loaded.')).toBeHidden()
})

test('the selector marks an attention count cut by a full window as a lower bound', async ({ page }) => {
  await installCorporationStubs(page)
  const ecosystems = Array.from({ length: 1024 }, (_, index) => ({
    id: index + 1,
    did: null,
    pending_tasks: 1,
    participants: 1,
    schemas: [],
  }))
  await page.route('**/v4/participant/pending/flat*', (route) =>
    route.fulfill({ json: { ecosystems: route.request().url().includes('corporation_id=13') ? ecosystems : [] } })
  )
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: /did:web:keplr/ })).toBeVisible({ timeout: 15_000 })
  await page
    .getByRole('button', { name: /did:web:keplr/ })
    .first()
    .click()
  await expect(page.getByLabel('1024+ Pending validator tasks')).toBeVisible()
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
  const proposalsTile = page.locator('#overview [data-stat="proposals"]')
  await expect(proposalsTile).toContainText('Unknown')
  await expect(proposalsTile).not.toContainText(/open/)
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
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

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
  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await submit.click()
  await expect(dialog).toContainText('that updates its members.')
  await expect(dialog).toContainText('Added with weight 3')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await page.getByLabel('Proposal type').selectOption('policy')
  await page.getByLabel('Threshold').fill('0')
  await expect(submit).toBeDisabled()
  await page.getByLabel('Threshold').fill('2')
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(dialog).toContainText('that changes its decision policy.')
  await expect(fact(dialog, 'Threshold')).toContainText('3 → 2')
  await expect(fact(dialog, 'Voting period')).toContainText('5m')
  await expect(fact(dialog, 'Minimum execution period')).toContainText('0s')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await page.getByLabel('Proposal type').selectOption('rotate')
  await expect(submit).toBeDisabled()
  await page.getByLabel('DID', { exact: true }).fill('did:web:next.example')
  await expect(submit).toBeEnabled()
  expect(mock.broadcastTxs()).toEqual([])
  await mock.teardown()
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

test('live updates: one subscription for each corporation, gap recovery and an indicator with no user action', async ({
  page,
}) => {
  await installCorporationStubs(page)
  let pendingTasks = 2
  await page.route('**/v4/participant/pending/flat*', (route) =>
    route.fulfill({
      json: {
        ecosystems: route.request().url().includes('corporation_id=13')
          ? [{ id: 1, did: null, pending_tasks: pendingTasks, participants: 2, schemas: [] }]
          : [],
      },
    })
  )
  // The indexer keeps the events it persisted and replays only the ones above `after_block_height`.
  const persisted: ReturnType<typeof indexerParticipantEvent>[] = []
  const replays: string[] = []
  await page.route('**/v4/indexer/events*', (route) => {
    const params = new URL(route.request().url()).searchParams
    const after = Number(params.get('after_block_height') ?? 0)
    replays.push(params.toString())
    const events = persisted.filter(
      (event) => event.block_height > after && params.get('corporation_id') === String(event.payload.corporation_id)
    )
    return route.fulfill({ json: { events, count: events.length, after_block_height: after } })
  })
  const replaysFromLastApplied = () =>
    replays.filter((search) => search.includes('corporation_id=13') && search.includes('after_block_height=1001'))
  const socket = await installIndexerSocket(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation')
  await expect(page.getByRole('heading', { name: /did:web:keplr/ })).toBeVisible({ timeout: 15_000 })

  // [VFE-DATA-WS-1] one subscription for each discovered Corporation, acting or not.
  await expect.poll(() => [...socket.subscribedCorporationIds()].sort()).toEqual([12, 13])

  await page
    .getByRole('button', { name: /did:web:keplr/ })
    .first()
    .click()
  await expect(page.getByLabel('2 Pending validator tasks')).toBeVisible()

  // [VFE-CORP-SEL-5] an event of a non-acting Corporation moves its indicator with no user action.
  pendingTasks = 5
  const live = indexerParticipantEvent('LIVE', 1001, 13)
  persisted.push(live)
  socket.pushBlock(13, 1001, [live])
  await expect(page.getByLabel('5 Pending validator tasks')).toBeVisible()
  expect(replaysFromLastApplied()).toHaveLength(0)

  // [VFE-DATA-WS-2] the chain moves on while block 1002 never reaches the client.
  const connectionsBeforeGap = socket.connectionsFor(13).length
  const hole = indexerParticipantEvent('HOLE', 1002, 13)
  const afterGap = indexerParticipantEvent('AFTERGAP', 1003, 13)
  persisted.push(hole, afterGap)
  socket.pushBlock(13, 1003, [afterGap])

  // The replay asks from the last applied height, so it brings the hole and not what was applied.
  await expect.poll(() => replaysFromLastApplied().length).toBe(1)
  await expect.poll(() => socket.connectionsFor(13).length).toBe(connectionsBeforeGap + 1)

  // The stream resumes on the new connection and asks for no second replay.
  pendingTasks = 7
  const resumed = indexerParticipantEvent('RESUMED', 1004, 13)
  persisted.push(resumed)
  socket.pushBlock(13, 1004, [resumed])
  await expect(page.getByLabel('7 Pending validator tasks')).toBeVisible()
  expect(replaysFromLastApplied()).toHaveLength(1)
})

test('live updates: guest mode holds no subscription and still tracks the height', async ({ page }) => {
  await installCorporationStubs(page)
  let height = 1001
  await page.route('**/v4/indexer/block-height', (route) => {
    height += 1
    return route.fulfill({ json: { height, timestamp: '2026-07-18T07:00:00Z' } })
  })
  const socket = await installIndexerSocket(page, 1001, 2000)

  await page.goto('/dashboard')
  await expect(page.getByRole('button', { name: /connect/i }).first()).toBeVisible({ timeout: 15_000 })

  await expect.poll(() => socket.openConnections().length).toBe(1)
  expect(socket.subscribedCorporationIds()).toEqual([])

  const blockHeight = page.locator('[data-stat="blockHeight"]')
  const readHeight = async () =>
    Number(
      ((await blockHeight.getAttribute('data-stat-value', { timeout: 1_000 }).catch(() => null)) ?? '').replace(
        /\D/g,
        ''
      )
    )
  await expect.poll(readHeight, { timeout: 15_000 }).toBeGreaterThan(1001)
  const seen = await readHeight()
  await expect.poll(readHeight, { timeout: 30_000 }).toBeGreaterThan(seen)
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

test('an operator row shows its spend limit, expiration and matching fee grant', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/corporation?tab=operators')
  const row = page.locator('#operators li').filter({ hasText: SECOND_OPERATOR })
  const toggle = row.getByRole('button', { name: new RegExp(SECOND_OPERATOR) })
  await expect(toggle).toContainText('22 message types · 5 VNA every 30d · Fee grant', { timeout: 15_000 })
  await expect(
    page.locator('#operators li').filter({ hasText: HARNESS_ADDRESS }).getByRole('button').first()
  ).not.toContainText('Fee grant')

  await toggle.click()
  await expect(fact(row, 'Spend limit')).toContainText('5 VNA')
  await expect(fact(row, 'Remaining spend')).toContainText('3.5 VNA')
  await expect(fact(row, 'Period')).toContainText('30d')
  const cycleEnd = await page.evaluate((iso) => new Date(iso).toLocaleString(), SECOND_OPERATOR_CYCLE_END)
  await expect(fact(row, 'Spend cycle ends')).toContainText(cycleEnd)
  await expect(fact(row, 'Fee grant')).toContainText('Yes')
  await expect(fact(row, 'Fee spend limit')).toContainText('2 VNA')
  await expect(fact(row, 'Fee remaining')).toContainText('1.25 VNA')
  await expect(fact(row, 'Fee period')).toContainText('7d')
  await expect(fact(row, 'Fee grant covers')).toContainText('The same 22 message types')

  await page.route('**/v4/delegation/fee-grants*', (route) =>
    route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )
  await page.reload()
  await expect(toggle).toContainText('22 message types · 5 VNA every 30d', { timeout: 15_000 })
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
  await expect(dialog).toContainText('for 22 message types')
  await expect(fact(dialog, 'Spend limit')).toContainText('5 VNA every 30d')
  await expect(fact(dialog, 'Expiration')).toContainText(`${expiration.replace('T', ' ')}:00`)
  await expect(fact(dialog, 'Grantee fee grant')).toContainText('2 VNA every 7d')
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
  await expect(page.getByText('2 of 22 message types selected', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '2 of 22 message types selected', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true'
  )
  await expect(page.getByText('Kept from the current authorization')).toBeVisible()

  await grantee.fill(SECOND_OPERATOR)
  await expect(page.getByText('22 of 22 message types selected', { exact: true })).toBeVisible()
  await grantee.fill(HARNESS_ADDRESS)
  await expect(page.getByText('2 of 22 message types selected', { exact: true })).toBeVisible()
  await grantee.fill(SECOND_OPERATOR)
  await expect(page.getByLabel('Spend limit (VNA)', { exact: true })).toHaveValue('5')
  await expect(page.getByLabel('Period (days)', { exact: true })).toHaveValue('30')
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
  await expect(fact(dialog, 'Spend limit')).toContainText('5 VNA every 30d')
  await expect(fact(dialog, 'Grantee fee grant')).toContainText('Revoked, the current fee grant is removed')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await expect(grantee).toHaveValue(SECOND_OPERATOR)
  await mock.teardown()
})

test('a re-grant proposal keeps the held types the picker does not list, even with no listed type selected', async ({
  page,
}) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address, stubSri: false, stubCorporation: false })

  await page.goto('/corporation?tab=proposals')
  await page.getByRole('button', { name: 'New proposal' }).click()
  await page.getByLabel('Grantee account').fill(HARNESS_ADDRESS)
  await expect(page.getByText('Kept from the current authorization')).toBeVisible()
  const submit = page.getByRole('button', { name: 'Submit proposal' })
  const listedHeld = [
    page.getByRole('checkbox', { name: 'UpdateCorporation', exact: true }),
    page.getByRole('checkbox', { name: 'RepaySlashedTrustDeposit', exact: true }),
  ]
  for (const checkbox of listedHeld) await checkbox.uncheck()
  await expect(submit).toBeEnabled()
  for (const checkbox of listedHeld) await checkbox.check()
  await submit.click()

  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(fact(dialog, 'Network fee')).toContainText(/VNA/, { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBe(1)

  const body = TxBody.decode(TxRaw.decode(fromBase64(mock.broadcastTxs()[0])).bodyBytes)
  const proposal = MsgSubmitProposal.decode(body.messages[0].value)
  const regrant = MsgGrantOperatorAuthorization.decode(proposal.messages[0].value)
  expect([...regrant.msgTypes].sort()).toEqual([...HARNESS_GRANTS_13].sort())
  await mock.teardown()
})
