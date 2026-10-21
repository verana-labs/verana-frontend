import { expect, type Page, test } from '@playwright/test'

const SNAPSHOT = {
  entity_type: 'GLOBAL',
  entity_id: null,
  block_height: 412893,
  timestamp: '2026-09-09T08:12:44.000Z',
  participants: 31,
  participants_ecosystem: 4,
  participants_issuer_grantor: 2,
  participants_issuer: 11,
  participants_verifier_grantor: 1,
  participants_verifier: 6,
  participants_holder: 7,
  active_ecosystems: 13,
  archived_ecosystems: 2,
  active_schemas: 25,
  archived_schemas: 3,
  weight: '9007199254740993123',
  issued: 184,
  verified: 2671,
  ecosystem_slash_events: 1,
  ecosystem_slashed_amount: 5000000,
  ecosystem_slashed_amount_repaid: 2500000,
  network_slash_events: 0,
  network_slashed_amount: 0,
  network_slashed_amount_repaid: 0,
}

const RETIRED_ROUTES = ['**/v4/metrics/**', '**/api/network-stats**']

const statValue = (page: Page, label: string) =>
  page
    .locator('p.font-medium', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=following-sibling::p[contains(@class,"font-mono")]')

test.use({ locale: 'en-US' })

test('Ring A, the dashboard stat cards render from the stats snapshot route', async ({ page }) => {
  test.setTimeout(90_000)

  const snapshotUrls: string[] = []
  const retiredUrls: string[] = []

  await page.route('**/v4/stats/snapshot*', (route) => {
    snapshotUrls.push(route.request().url())
    return route.fulfill({ json: SNAPSHOT })
  })
  for (const pattern of RETIRED_ROUTES) {
    await page.route(pattern, (route) => {
      retiredUrls.push(route.request().url())
      return route.fulfill({ status: 404, json: { error: 'gone', code: 404 } })
    })
  }

  await page.goto('/dashboard', { timeout: 60_000 })
  await page.waitForLoadState('domcontentloaded')

  await expect(statValue(page, 'Ecosystems')).toHaveText('13')
  await expect(statValue(page, 'Schemas')).toHaveText('25')
  await expect(statValue(page, 'Participants')).toHaveText('31')
  await expect(statValue(page, 'Total Locked Trust Deposit')).toHaveText('9,007,199,254,740.993123 VNA')
  await expect(statValue(page, 'Issued Credentials')).toHaveText('184')
  await expect(statValue(page, 'Verified Credentials')).toHaveText('2,671')

  expect(snapshotUrls.length).toBeGreaterThan(0)
  for (const url of snapshotUrls) expect(url).toContain('entity_type=GLOBAL')
  expect(retiredUrls).toEqual([])
})

test('Ring A, a stalled indexer is flagged next to its version', async ({ page }) => {
  await page.route('**/v4/stats/snapshot*', (route) => route.fulfill({ json: SNAPSHOT }))
  await page.route('**/v4/indexer/status', (route) =>
    route.fulfill({ json: { is_running: true, is_crawling: false, stopped_reason: 'RPC unavailable' } })
  )

  await page.goto('/dashboard', { timeout: 60_000 })

  const stalled = page.getByTitle('RPC unavailable')
  await expect(stalled).toBeVisible({ timeout: 30_000 })
  await expect(stalled).toContainText('stalled')
})

test('Ring A, a stopped indexer answering 503 reads as down with its reason', async ({ page }) => {
  await page.route('**/v4/stats/snapshot*', (route) => route.fulfill({ json: SNAPSHOT }))
  await page.route('**/v4/indexer/status', (route) =>
    route.fulfill({ status: 503, json: { error: 'Indexer is not responding. RPC unavailable', code: 503 } })
  )

  await page.goto('/dashboard', { timeout: 60_000 })

  const down = page.getByTitle('Indexer is not responding. RPC unavailable')
  await expect(down).toBeVisible({ timeout: 30_000 })
  await expect(down).toContainText('down')
})

test('Ring A, the graph shows its version next to the indexer and is flagged when unreachable', async ({ page }) => {
  await page.route('**/v4/stats/snapshot*', (route) => route.fulfill({ json: SNAPSHOT }))
  await page.route('**/docs/openapi.json', (route) =>
    route.fulfill({ json: { openapi: '3.0.3', info: { title: 'Verana Graph API', version: '1.0.0' } } })
  )
  await page.route(/\/\/graph\.[^/]+\/health$/, (route) => route.fulfill({ status: 502, body: 'Bad Gateway' }))

  await page.goto('/dashboard', { timeout: 60_000 })

  const graph = page.locator('aside span', { hasText: /^graph$/ }).locator('xpath=following-sibling::span[1]')
  await expect(graph).toContainText('v1.0.0')
  await expect(graph).toContainText('unreachable', { timeout: 30_000 })
})
