import { createHash } from 'node:crypto'
import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { HARNESS_MNEMONIC } from './support/corp-stubs'
import { installMockChain, stubCorporationRoutes } from './support/mock-chain'

const ACME_ID = 9450
const ACME_DID = 'did:web:acme-join.example'
const EGF_URL = 'https://gov.acme-join.example/egf.md'
const EGF_MARKDOWN = '# Acme join framework\n\nParticipants follow these rules.\n'
const MARKDOWN_HEADERS = { 'access-control-allow-origin': '*', 'content-type': 'text/markdown; charset=utf-8' }
const CREATED = '2026-09-01T10:00:00Z'
const SERVICE_DID = 'did:web:ring-a-join.example'

const sri = (text: string) => `sha384-${createHash('sha384').update(text).digest('base64')}`

function trustData(did: string, trusted: boolean, name: string) {
  return {
    did,
    trusted,
    evaluatedAtTime: CREATED,
    evaluatedAtBlock: 1,
    expiresAtTime: null,
    ecsCredentials: [{ ecsSchema: 'ServiceCredential', credentialSubject: { name } }],
  }
}

function ecosystem(id: number, name: string, weight: string, trusted = true) {
  const did = id === ACME_ID ? ACME_DID : `did:web:ecosystem-${id}.example`
  const documents = id === ACME_ID ? [{ id: 1, url: EGF_URL, language: 'en', digest_sri: sri(EGF_MARKDOWN) }] : []
  return {
    id,
    did,
    corporation_id: 100 + id,
    created: CREATED,
    modified: CREATED,
    language: 'en',
    active_version: 1,
    versions: [{ id, version: 1, active_since: CREATED, documents }],
    participants: 2,
    active_schemas: 1,
    weight,
    issued: 3,
    verified: 4,
    archived: null,
    trust_data: trustData(did, trusted, name),
  }
}

const ECOSYSTEMS = [
  ecosystem(ACME_ID, 'Acme Join Registry', '3000'),
  ecosystem(9449, 'Zeta Registry', '10'),
  ecosystem(9448, 'Shady Registry', '500', false),
  ecosystem(9447, 'Beta Registry', '90000000'),
  ecosystem(9446, 'Gamma Registry', '7'),
  ecosystem(9445, 'Beyond The Window Registry', '1'),
]

const SCHEMA = {
  id: 94500,
  ecosystem_id: ACME_ID,
  json_schema: JSON.stringify({ title: 'Acme Membership', description: 'Acme membership credential' }),
  issuer_grantor_validation_validity_period: 0,
  verifier_grantor_validation_validity_period: 0,
  issuer_validation_validity_period: 0,
  verifier_validation_validity_period: 0,
  holder_validation_validity_period: 0,
  issuer_onboarding_mode: 'OPEN',
  verifier_onboarding_mode: 'OPEN',
  holder_onboarding_mode: 'PERMISSIONLESS',
  pricing_asset_type: 'COIN',
  pricing_asset: 'uvna',
  participants: 1,
  issued: 0,
  verified: 0,
  weight: 0,
  archived: null,
}

function participant(id: number, role: string, corporationId: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    schema_id: SCHEMA.id,
    ecosystem_id: ACME_ID,
    role,
    did: role === 'ECOSYSTEM' ? ACME_DID : SERVICE_DID,
    corporation_id: corporationId,
    participant_state: 'ACTIVE',
    effective_until: null,
    validation_fees: 0,
    corporation_available_actions: [],
    validator_available_actions: [],
    ...extra,
  }
}

async function stubDiscover(page: Page) {
  await page.route('**/v4/ecosystem/list*', (route) => route.fulfill({ json: { ecosystems: ECOSYSTEMS } }))
  await page.route(`**/v4/ecosystem/get/${ACME_ID}*`, (route) => route.fulfill({ json: { ecosystem: ECOSYSTEMS[0] } }))
  await page.route('**/v4/credential-schema/list*', (route) => {
    const ecosystemId = new URL(route.request().url()).searchParams.get('ecosystem_id')
    return route.fulfill({ json: { schemas: ecosystemId === String(ACME_ID) ? [SCHEMA] : [] } })
  })
  await page.route('**/v4/participant/list*', (route) => {
    const params = new URL(route.request().url()).searchParams
    if (params.get('corporation_id') === '7' && params.get('ecosystem_id') === String(ACME_ID)) {
      return route.fulfill({ json: { participants: [participant(31, 'HOLDER', 7), participant(30, 'ISSUER', 7)] } })
    }
    const candidateQuery =
      params.get('role') === 'ECOSYSTEM' &&
      params.get('participant_state') === 'ACTIVE' &&
      params.get('trust_data') === 'full'
    const validator = participant(20, 'ECOSYSTEM', 100 + ACME_ID, {
      trust_data: { did: ACME_DID, trusted: true, expiresAtTime: null },
    })
    return route.fulfill({ json: { participants: candidateQuery ? [validator] : [] } })
  })
  await page.route('**/v4/verifiable-trust/resolve', (route) =>
    route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
  )
  await page.route(EGF_URL, (route) => route.fulfill({ status: 200, headers: MARKDOWN_HEADERS, body: EGF_MARKDOWN }))
}

const cardNames = (page: Page) =>
  page.locator('#ecosystem-list article').evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')))

test('discover lists every ecosystem of the window, finds one by name and orders by locked trust value', async ({
  page,
}) => {
  await stubDiscover(page)
  await page.goto('/discover')

  await expect(page.locator('#ecosystem-list article')).toHaveCount(5)
  expect(await cardNames(page)).toEqual([
    'Acme Join Registry',
    'Zeta Registry',
    'Shady Registry',
    'Beta Registry',
    'Gamma Registry',
  ])
  await expect(page.getByText('Sorting and filters apply to the loaded results only.').first()).toBeVisible()

  await page.locator('#discover-order').selectOption('trustValue')
  await expect
    .poll(() => cardNames(page))
    .toEqual(['Beta Registry', 'Acme Join Registry', 'Shady Registry', 'Zeta Registry', 'Gamma Registry'])

  await page.locator('#show-untrusted').uncheck()
  await expect(page.getByRole('article', { name: 'Shady Registry' })).toBeHidden()

  await page.locator('#ecosystem-search').fill('acme join')
  await expect(page.locator('#ecosystem-list article')).toHaveCount(1)
  const acme = page.getByRole('article', { name: 'Acme Join Registry' })
  for (const label of ['Active Schemas:', 'Participants:', 'Trust Value:', 'Issued Credentials:']) {
    await expect(acme.getByText(label)).toBeVisible()
  }
  await expect(acme.getByRole('heading', { name: 'Acme Membership' })).toBeVisible()
  await expect(acme.getByRole('link', { name: 'Join' })).toHaveCount(0)

  await acme.getByRole('button', { name: 'EGF' }).click()
  await expect(acme.getByRole('status')).toHaveText('Verified')
  await expect(acme.getByRole('heading', { name: 'Acme join framework' })).toBeVisible()
})

test('an acting corporation sees its roles and reaches the confirmation of a self-create with a VS operator', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await stubCorporationRoutes(page)
  await stubDiscover(page)
  const wallet = await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })
  const mock = await installMockChain(page, { address: wallet.bech32Address })

  await page.goto('/discover')
  const acme = page.getByRole('article', { name: 'Acme Join Registry' })
  await expect(acme.getByText('ISSUER', { exact: true })).toBeVisible()
  await expect(acme.getByText('HOLDER', { exact: true })).toBeVisible()
  await acme.getByRole('link', { name: 'Join' }).click()
  await expect(page).toHaveURL(new RegExp(`/join/${ACME_ID}$`))

  const next = page.getByRole('button', { name: 'Continue', exact: true })
  await next.click()
  await page.getByRole('button', { name: /Acme Membership/ }).click()
  await next.click()

  await page.getByRole('button', { name: /Holder/ }).click()
  await expect(page.getByText('No on-chain onboarding is needed')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Find an authorized issuer' })).toHaveAttribute(
    'href',
    `/participants/${SCHEMA.id}`
  )
  await expect(next).toBeDisabled()

  await page.getByRole('button', { name: /Issuer/ }).click()
  await next.click()
  const accept = page.locator('#egf-accept')
  await expect(accept).toBeEnabled()
  await accept.check()
  await next.click()

  const validator = page.getByRole('button', { name: new RegExp(ACME_DID) })
  await expect(validator.getByText('Trusted')).toBeVisible()
  await validator.click()
  await next.click()

  await page.locator('#service-did').fill(SERVICE_DID)
  await expect(page.locator('#self-create-effectiveFrom')).toBeVisible()
  await expect(page.locator('#self-create-validationFees')).toBeVisible()
  await page.locator('#self-create-validationFees').fill('1.5')
  await expect(page.getByText('Fees must be whole numbers of base units.')).toBeVisible()
  await page.locator('#self-create-validationFees').fill('2500')

  await page.getByText('Advanced: VS operator delegation').click()
  await expect(page.getByText(/This configuration is frozen at creation/)).toBeVisible()
  const join = page.getByRole('button', { name: 'Join Ecosystem' })
  await page.locator('#vs-operator-vsOperator').fill('not-an-address')
  await expect(page.getByText('The VS operator must be a Verana account address.')).toBeVisible()
  await expect(join).toBeDisabled()
  await page.locator('#vs-operator-vsOperator').fill(wallet.bech32Address)
  await page.getByLabel('CreateOrUpdateParticipantSession').check()
  await expect(join).toBeEnabled()

  await join.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByText(`Join as ISSUER with ${SERVICE_DID}.`)).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(mock.seenMethods()).not.toContain('broadcast_tx_sync')
  await mock.teardown()
})
