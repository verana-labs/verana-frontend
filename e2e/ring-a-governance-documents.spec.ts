import { createHash } from 'node:crypto'
import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { ACME_TRUST_DATA } from './support/corp-fixtures'
import { ACME_DID, HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'
import { DEFAULT_DOC_URL } from './support/flows'

const ECOSYSTEM_ID = '9441'
const SCHEMA_ID = 94410
const ACTING_CORPORATION_ID = 13
const EN_URL = 'https://gov.acme-trust.example/egf-en.md'
const ES_URL = 'https://gov.acme-trust.example/egf-es.md'
const EN_MARKDOWN = '# Acme governance framework\n\nParticipants follow these rules.\n'
const ES_MARKDOWN = '# Marco de gobernanza de Acme\n\nLos participantes siguen estas reglas.\n'
const MOSIP_BLOB_URL = DEFAULT_DOC_URL.replace(
  /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\//,
  'https://github.com/$1/$2/blob/'
)
const MOSIP_DIGEST = 'sha384-PP6AbuFetAmv4S6DTXzOVV69+nTZXzsooHyAmifQq/I4dir7cUavg17UnLjnh0yn'
const MARKDOWN_HEADERS = { 'access-control-allow-origin': '*', 'content-type': 'text/markdown; charset=utf-8' }

const sri = (text: string) => `sha384-${createHash('sha384').update(text).digest('base64')}`

const SCHEMA = {
  id: SCHEMA_ID,
  ecosystem_id: Number(ECOSYSTEM_ID),
  json_schema: JSON.stringify({ title: 'Acme Membership', description: 'Acme membership credential' }),
  issuer_grantor_validation_validity_period: 0,
  verifier_grantor_validation_validity_period: 0,
  issuer_validation_validity_period: 0,
  verifier_validation_validity_period: 0,
  holder_validation_validity_period: 0,
  issuer_onboarding_mode: 'OPEN',
  verifier_onboarding_mode: 'OPEN',
  holder_onboarding_mode: null,
  pricing_asset_type: 'COIN',
  pricing_asset: 'uvna',
  digest_algorithm: 'sha384',
  participants: 0,
  issued: 0,
  verified: 0,
  weight: 0,
  archived: null,
}

type Document = { id: number; url: string; language: string; digest_sri: string }

async function stubEcosystem(page: Page, documents: Document[]) {
  await page.route(`**/v4/ecosystem/get/${ECOSYSTEM_ID}*`, (route) =>
    route.fulfill({
      json: {
        ecosystem: {
          id: Number(ECOSYSTEM_ID),
          did: 'did:web:gov.acme-trust.example',
          corporation_id: 13,
          created: '2026-09-01T10:00:00Z',
          modified: '2026-09-01T10:00:00Z',
          language: 'en',
          active_version: 1,
          participants: 0,
          active_schemas: 1,
          weight: 0,
          issued: 0,
          verified: 0,
          archived: null,
          versions: [{ id: 1, version: 1, active_since: '2026-09-01T10:00:00Z', documents }],
        },
      },
    })
  )
  await page.route('**/v4/credential-schema/list*', (route) => route.fulfill({ json: { schemas: [SCHEMA] } }))
  await page.route('**/v4/verifiable-trust/resolve', (route) =>
    route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
  )
}

async function serveMarkdown(page: Page, url: string, body: string) {
  await page.route(url, (route) => route.fulfill({ status: 200, headers: MARKDOWN_HEADERS, body }))
}

async function openViewer(page: Page) {
  await page.goto(`/ecosystems/${ECOSYSTEM_ID}`)
  await page.getByRole('button', { name: 'View', exact: true }).first().click()
  return page.locator('div.text-left', { has: page.getByLabel('Document language') }).last()
}

const bilingual: Document[] = [
  { id: 1, url: EN_URL, language: 'en', digest_sri: sri(EN_MARKDOWN) },
  { id: 2, url: ES_URL, language: 'es', digest_sri: sri(ES_MARKDOWN) },
]

test('the ecosystem page renders a verified document and offers every document of the version', async ({ page }) => {
  await stubEcosystem(page, bilingual)
  await serveMarkdown(page, EN_URL, EN_MARKDOWN)
  await serveMarkdown(page, ES_URL, '# Manipulado\n')
  const viewer = await openViewer(page)

  await expect(viewer.getByRole('status')).toHaveText('Verified')
  await expect(viewer.getByRole('heading', { name: 'Acme governance framework' })).toBeVisible()
  await expect(viewer.getByText(`Digest: ${sri(EN_MARKDOWN)}`)).toBeVisible()
  await expect(viewer.getByLabel('Document language').locator('option')).toHaveCount(2)
  await expect(viewer.getByRole('button', { name: 'Download' })).toBeVisible()
  await expect(viewer.getByRole('link', { name: 'Open source URL' })).toBeVisible()

  await viewer.getByLabel('Document language').selectOption('2')
  await expect(viewer.getByRole('status')).toHaveText('Digest mismatch')
  await expect(viewer.getByText(`Digest: ${sri(ES_MARKDOWN)}`)).toBeVisible()
  await expect(viewer.getByText(/does not match its on-chain digest/)).toBeVisible()
  await expect(viewer.getByText('Manipulado')).toBeHidden()
  await expect(viewer.getByRole('heading', { name: 'Acme governance framework' })).toBeHidden()
  await expect(viewer.getByRole('button', { name: 'Download' })).toBeHidden()
  await expect(viewer.getByRole('link', { name: 'Open source URL' })).toBeHidden()
})

test('a document the browser cannot fetch is verified through the server route', async ({ page }) => {
  await stubEcosystem(page, [{ id: 1, url: MOSIP_BLOB_URL, language: 'en', digest_sri: MOSIP_DIGEST }])
  const serverAnswers: number[] = []
  page.on('response', (response) => {
    if (response.url().includes('/api/verified-fetch')) serverAnswers.push(response.status())
  })
  await page.route(DEFAULT_DOC_URL, (route) => route.abort('failed'))
  const viewer = await openViewer(page)

  await expect(viewer.getByRole('status')).toHaveText('Verified', { timeout: 30_000 })
  await expect(viewer.getByRole('heading', { name: /MOSIP Pilot Authority/ })).toBeVisible()
  expect(serverAnswers.length).toBeGreaterThan(0)
  expect(serverAnswers.every((status) => status === 200)).toBe(true)
})

test('a document neither the browser nor the server can fetch is reported as unverified', async ({ page }) => {
  await stubEcosystem(page, bilingual.slice(0, 1))
  await page.route(EN_URL, (route) => route.abort('failed'))
  await page.route('**/api/verified-fetch**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Upstream fetch failed: boom' } })
  )
  const viewer = await openViewer(page)

  await expect(viewer.getByRole('status')).toHaveText('Could not verify')
  await expect(viewer.getByText(/could not be verified against its on-chain digest/)).toBeVisible()
  await expect(viewer.getByText('Upstream fetch failed: boom')).toBeVisible()
  await expect(viewer.getByRole('button', { name: 'Download' })).toBeHidden()
})

async function stubParticipantTree(page: Page) {
  await page.route(`**/v4/credential-schema/get/${SCHEMA_ID}*`, (route) => route.fulfill({ json: { schema: SCHEMA } }))
  await page.route('**/v4/participant/list*', (route) => {
    const role = new URL(route.request().url()).searchParams.get('role')
    const participants =
      role === 'ECOSYSTEM'
        ? [
            {
              id: 9442,
              schema_id: SCHEMA_ID,
              role: 'ECOSYSTEM',
              did: ACME_DID,
              trust_data: ACME_TRUST_DATA,
              corporation_id: ACTING_CORPORATION_ID,
              participant_state: 'ACTIVE',
              op_state: 'VALIDATED',
              validator_participant_id: null,
              effective_from: '2026-09-01T10:30:00Z',
              effective_until: null,
              validation_fees: 0,
              issuance_fees: 0,
              verification_fees: 0,
              deposit: 0,
              corporation_available_actions: [],
              validator_available_actions: [],
            },
          ]
        : []
    return route.fulfill({ json: { participants } })
  })
}

async function reachGovernanceStep(page: Page) {
  await installCorporationStubs(page)
  await stubParticipantTree(page)
  await seedActingCorporation(page, ACTING_CORPORATION_ID)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  await page.goto(`/participants/${SCHEMA_ID}`)
  await page
    .locator('div.rounded-lg.p-2')
    .filter({ hasText: 'Issuers' })
    .getByRole('button', { name: /join/ })
    .click({ timeout: 15_000 })
  return page.getByRole('button', { name: 'Continue', exact: true })
}

test('joining from the participant tree blocks accepting a document that does not match its digest', async ({
  page,
}) => {
  await stubEcosystem(page, bilingual)
  await serveMarkdown(page, EN_URL, '# Tampered\n')
  await serveMarkdown(page, ES_URL, ES_MARKDOWN)
  const next = await reachGovernanceStep(page)
  const accept = page.locator('#egf-accept')

  await expect(page.getByText('This document does not match its on-chain digest, it cannot be accepted.')).toBeVisible()
  await expect(accept).toBeDisabled()
  await expect(next).toBeDisabled()
  await expect(page.getByText('Tampered')).toBeHidden()

  await page.getByLabel('Document language').selectOption('2')
  await expect(accept).toBeEnabled()
  await accept.check()
  await expect(next).toBeEnabled()

  await page.getByLabel('Document language').selectOption('1')
  await expect(accept).not.toBeChecked()
  await expect(next).toBeDisabled()
})

test('joining from the participant tree takes the acceptance only once the shown document is checked', async ({
  page,
}) => {
  await stubEcosystem(page, bilingual)
  let release: (() => void) | undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(EN_URL, async (route) => {
    await held
    await route.fulfill({ status: 200, headers: MARKDOWN_HEADERS, body: EN_MARKDOWN })
  })
  await serveMarkdown(page, ES_URL, ES_MARKDOWN)
  const next = await reachGovernanceStep(page)
  const accept = page.locator('#egf-accept')

  await expect(page.getByText('Checking the document against its on-chain digest…')).toBeVisible()
  await expect(accept).toBeDisabled()
  await expect(next).toBeDisabled()

  release?.()
  await expect(accept).toBeEnabled()
  await accept.check()
  await expect(next).toBeEnabled()

  await page.getByLabel('Document language').selectOption('2')
  await expect(accept).toBeEnabled()
  await expect(accept).not.toBeChecked()
  await expect(next).toBeDisabled()
})
