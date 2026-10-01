import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import {
  ACME_DID,
  ACME_ECOSYSTEM_DID,
  AGENT_ADMIN_ENDPOINT,
  AGENT_IDLE_DID,
  AGENT_ONE_DID,
  AGENT_ONE_SERVICE_NAME,
  AGENT_TWO_DID,
  AGENT_UNVERIFIABLE_DID,
  VS_OPERATOR,
} from './support/corp-fixtures'
import {
  type AgentStubOptions,
  HARNESS_MNEMONIC,
  installAgentStubs,
  installCorporationStubs,
  seedActingCorporation,
} from './support/corp-stubs'

const CARD = 'section#agents-grid article'

async function openAgents(page: Page, opts: AgentStubOptions = {}) {
  await installCorporationStubs(page)
  await installAgentStubs(page, opts)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  await page.goto('/agents')
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test('the page pins the Corporation and its Ecosystems first and lists each DID once', async ({ page }) => {
  await openAgents(page)

  const cards = page.locator(CARD)
  await expect(cards).toHaveCount(4, { timeout: 15_000 })

  await expect(cards.nth(0)).toContainText(ACME_DID)
  await expect(cards.nth(0).getByText('Corporation', { exact: true })).toBeVisible()
  await expect(cards.nth(1)).toContainText(ACME_ECOSYSTEM_DID)
  await expect(cards.nth(1).getByText('Ecosystem', { exact: true })).toBeVisible()
  await expect(cards.nth(2)).toContainText(AGENT_ONE_DID)
  await expect(cards.nth(3)).toContainText(AGENT_TWO_DID)

  await expect(page.getByRole('heading', { name: 'Acme Ecosystem Registry' })).toHaveCount(1)
  await expect(page.getByText(AGENT_IDLE_DID)).toBeHidden()
  await expect(page.getByText(AGENT_UNVERIFIABLE_DID)).toBeHidden()
})

test('the page needs an acting corporation', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await installAgentStubs(page)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await expect(page.getByRole('link', { name: 'Agents' })).toBeHidden()

  await page.goto('/agents')
  await expect(page.getByText('This wallet operates no corporation yet.')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator(CARD)).toHaveCount(0)
})

test('a card carries the identity, the credentials, the accreditations and the endpoints', async ({ page }) => {
  await openAgents(page)

  const card = page.locator(CARD).filter({ hasText: AGENT_ONE_DID })
  await expect(card.getByRole('heading', { name: AGENT_ONE_SERVICE_NAME })).toBeVisible({ timeout: 15_000 })
  await expect(card).toContainText('Acme Trust AG')
  await expect(card.getByLabel('Trusted')).toBeVisible()

  await expect(card.getByText('Credentials presented')).toBeVisible()
  await expect(card.getByText('OrganizationCredential')).toBeVisible()
  await expect(card.getByText('ServiceCredential')).toBeVisible()
  await expect(card.getByRole('link', { name: /Verifiable Presentation/ })).toHaveAttribute(
    'href',
    'https://agent-one.example/vp.json'
  )

  await expect(card.getByText('Accreditations')).toBeVisible()
  await expect(card.getByText('ISSUER')).toBeVisible()
  await expect(card.getByText('ACTIVE')).toBeVisible()

  await expect(card.getByText('Service endpoints')).toBeVisible()
  await expect(card.getByText('VsAgentAdminAPI')).toBeVisible()
  await expect(card.getByRole('link', { name: /Open administration interface/ })).toHaveAttribute(
    'href',
    AGENT_ADMIN_ENDPOINT
  )
})

test('an accreditation row with a delegation record expands, one without has no expander', async ({ page }) => {
  await openAgents(page)

  const delegated = page.locator(CARD).filter({ hasText: AGENT_ONE_DID })
  const row = delegated.getByRole('button').first()
  await expect(row).toBeVisible({ timeout: 15_000 })
  await expect(row).toHaveAttribute('aria-expanded', 'false')
  await expect(delegated.getByText(VS_OPERATOR)).toBeHidden()

  await row.click()
  await expect(row).toHaveAttribute('aria-expanded', 'true')
  await expect(delegated.getByText('VS operator', { exact: true })).toBeVisible()
  await expect(delegated.getByText(VS_OPERATOR)).toBeVisible()
  await expect(delegated.getByText('Spend limit', { exact: true })).toBeVisible()
  await expect(delegated.getByText('Remaining spend', { exact: true })).toBeVisible()
  await expect(delegated.getByText('Fee grant')).toBeVisible()
  await expect(delegated.getByText('Period')).toBeVisible()
  await expect(delegated.getByText('Spend cycle ends')).toBeVisible()
  await expect(delegated.getByRole('link', { name: 'Open participant card' })).toHaveAttribute(
    'href',
    /\/participants\/26.*102/
  )

  const plain = page.locator(CARD).filter({ hasText: AGENT_TWO_DID })
  await expect(plain.getByText('VERIFIER')).toBeVisible()
  await expect(plain.getByRole('button')).toHaveCount(0)
})

test('both filters start off, and neither one hides a pinned entry', async ({ page }) => {
  await openAgents(page)

  const inactive = page.getByLabel('Include inactive participant entries')
  const unverifiable = page.getByLabel('Show unverifiable agents')
  await expect(inactive).not.toBeChecked()
  await expect(unverifiable).not.toBeChecked()
  await expect(page.locator(CARD)).toHaveCount(4, { timeout: 15_000 })

  await inactive.check()
  await expect(page.locator(CARD)).toHaveCount(5)
  const idle = page.locator(CARD).filter({ hasText: AGENT_IDLE_DID })
  await expect(idle.getByText('INACTIVE')).toBeVisible()

  await unverifiable.check()
  await expect(page.locator(CARD)).toHaveCount(6)
  await expect(page.locator(CARD).filter({ hasText: AGENT_UNVERIFIABLE_DID }).getByLabel('Untrusted')).toBeVisible()

  await inactive.uncheck()
  await unverifiable.uncheck()
  await expect(page.locator(CARD)).toHaveCount(4)
  await expect(page.locator(CARD).nth(0)).toContainText(ACME_DID)
  await expect(page.locator(CARD).nth(1)).toContainText(ACME_ECOSYSTEM_DID)
})

test('a failed ecosystem or delegation load degrades instead of reading as empty', async ({ page }) => {
  await openAgents(page, { ecosystemsDown: true, delegationsDown: true })

  await expect(
    page.getByText('The controlled ecosystems could not be loaded, their pinned cards are missing.')
  ).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByText('The delegation details could not be loaded, no accreditation row can be expanded.')
  ).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Acme Ecosystem Registry' })).toHaveCount(1)
  await expect(page.getByText('Ecosystem', { exact: true })).toHaveCount(0)
  const delegated = page.locator(CARD).filter({ hasText: AGENT_ONE_DID })
  await expect(delegated.getByText('ISSUER')).toBeVisible()
  await expect(delegated.getByRole('button')).toHaveCount(0)
})

test('a resolver failure holds the unavailable state instead of reading as no data', async ({ page }) => {
  await openAgents(page, { resolverDown: true })

  const pinned = page.locator(CARD).filter({ hasText: ACME_DID })
  const unavailable = pinned.getByText("The resolver could not be reached, this agent's data is unavailable.")
  await expect(unavailable.first()).toBeVisible({ timeout: 15_000 })

  await page.waitForTimeout(7_000)
  await expect(unavailable.first()).toBeVisible()
  await expect(pinned.getByText('No credentials presented.')).toBeHidden()
})

test('the Corporation page shows the same records read-only and cross-links both ways', async ({ page }) => {
  await openAgents(page)

  await page.getByRole('link', { name: /Raw authorizations/ }).click()
  await expect(page).toHaveURL(/tab=operators/)

  const card = page.locator('#agents')
  await expect(card.getByText('Agent Authorizations')).toBeVisible({ timeout: 15_000 })
  await expect(card.getByText(VS_OPERATOR)).toBeVisible()
  await expect(card.getByText('1 participant records')).toBeVisible()
  await expect(card.getByRole('button', { name: /Grant|Revoke/ })).toHaveCount(0)
  await expect(
    card.getByText('VS operator authorizations are managed by the participant flows and are read-only here.')
  ).toBeVisible()

  await card.getByRole('button', { name: new RegExp(VS_OPERATOR) }).click()
  await expect(card.getByText('#102')).toBeVisible()
  await expect(card.getByText('Spend limit', { exact: true })).toBeVisible()
  await expect(card.getByText('Remaining fee spend')).toHaveCount(0)

  await card.getByRole('link', { name: /View as agents/ }).click()
  await expect(page).toHaveURL(/\/agents$/)
  await expect(page.locator(CARD).first()).toContainText(ACME_DID, { timeout: 15_000 })
})

test('the agents page holds at mobile width', async ({ page }) => {
  await openAgents(page)
  await page.setViewportSize({ width: 390, height: 844 })

  await expect(page.locator(CARD).first()).toContainText(ACME_DID, { timeout: 15_000 })
  await noHorizontalOverflow(page)

  await page.getByLabel('Include inactive participant entries').check()
  await expect(page.getByText(AGENT_IDLE_DID)).toBeVisible()
  await noHorizontalOverflow(page)
})
