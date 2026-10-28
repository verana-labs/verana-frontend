import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { ACME_TRUST_DATA } from './support/corp-fixtures'
import { ACME_DID, HARNESS_MNEMONIC, installCorporationStubs } from './support/corp-stubs'

const PERMISSIONLESS_SCHEMA_ID = 81
const ISSUER_OP_SCHEMA_ID = 82
const UNSET_MODE_SCHEMA_ID = 83
const ECOSYSTEM_ID = 13
const ISSUER_DID = 'did:web:northwind.example'
const ISSUER_NAME = 'Northwind Credentials'
const WEBSITE = 'https://northwind.example/get-a-credential'
const EMAIL = 'issuer@example.com'
const CONTACT_MESSAGE =
  'This issuer does not publish a website or a contact email. Get in touch with the issuer to find out how to get a credential issued.'
const ISSUER_TRUST_DATA = {
  ...ACME_TRUST_DATA,
  did: ISSUER_DID,
  ecsCredentials: [{ ecsSchema: 'ServiceCredential', credentialSubject: { name: ISSUER_NAME } }],
}

function schema(id: number, holderOnboardingMode: string | null) {
  return {
    id,
    ecosystem_id: ECOSYSTEM_ID,
    json_schema: JSON.stringify({ title: `Schema ${id}`, description: 'Holder join fixture', type: 'object' }),
    issuer_grantor_validation_validity_period: 0,
    verifier_grantor_validation_validity_period: 0,
    issuer_validation_validity_period: 365,
    verifier_validation_validity_period: 365,
    holder_validation_validity_period: 0,
    issuer_onboarding_mode: 'ECOSYSTEM_ONBOARDING_PROCESS',
    verifier_onboarding_mode: 'OPEN',
    holder_onboarding_mode: holderOnboardingMode,
    pricing_asset_type: 'COIN',
    pricing_asset: 'uvna',
    digest_algorithm: 'sha384',
    title: `Schema ${id}`,
    description: 'Holder join fixture',
    archived: null,
  }
}

function participant(id: number, schemaId: number, role: string, did: string, validatorId: number | null) {
  return {
    id,
    schema_id: schemaId,
    role,
    did,
    trust_data: did === ACME_DID ? ACME_TRUST_DATA : ISSUER_TRUST_DATA,
    corporation_id: id,
    participant_state: 'ACTIVE',
    op_state: 'VALIDATED',
    validator_participant_id: validatorId,
    effective_from: '2026-09-01T10:30:00Z',
    effective_until: null,
    validation_fees: 0,
    issuance_fees: 0,
    verification_fees: 0,
    deposit: 0,
    corporation_available_actions: [],
    validator_available_actions: [],
  }
}

async function installTreeStubs(page: Page, services: unknown[]) {
  for (const [id, mode] of [
    [PERMISSIONLESS_SCHEMA_ID, 'PERMISSIONLESS'],
    [ISSUER_OP_SCHEMA_ID, 'ISSUER_ONBOARDING_PROCESS'],
    [UNSET_MODE_SCHEMA_ID, null],
  ] as const) {
    await page.route(`**/v4/credential-schema/get/${id}*`, (route) =>
      route.fulfill({ json: { schema: schema(id, mode) } })
    )
  }
  await page.route(`**/v4/ecosystem/get/${ECOSYSTEM_ID}*`, (route) =>
    route.fulfill({
      json: {
        ecosystem: {
          id: ECOSYSTEM_ID,
          did: ACME_DID,
          corporation_id: ECOSYSTEM_ID,
          created: '2026-09-01T10:00:00Z',
          modified: '2026-09-01T10:00:00Z',
          language: 'en',
          active_version: 1,
          participants: 2,
          active_schemas: 2,
          weight: 0,
          issued: 0,
          verified: 0,
          archived: null,
          versions: [],
        },
      },
    })
  )
  await page.route('**/v4/participant/list*', (route) => {
    const params = new URL(route.request().url()).searchParams
    const schemaId = Number(params.get('schema_id'))
    const role = params.get('role')
    const participants =
      role === 'ECOSYSTEM'
        ? [participant(701, schemaId, 'ECOSYSTEM', ACME_DID, null)]
        : role === 'ISSUER' && params.get('validator_participant_id') === '701'
          ? [participant(702, schemaId, 'ISSUER', ISSUER_DID, 701)]
          : []
    return route.fulfill({ json: { participants } })
  })
  await page.route('**/v4/verifiable-trust/resolve', (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as { did?: string }
    if (body.did !== ISSUER_DID) return route.fulfill({ status: 404, json: { error: 'DID not found', code: 404 } })
    return route.fulfill({ json: { ...ISSUER_TRUST_DATA, services } })
  })
}

function treeRow(page: Page, text: string) {
  return page.locator('[data-slot="tree-row"]').filter({ hasText: text })
}

async function openHolders(page: Page, schemaId: number) {
  await page.goto(`/participants/${schemaId}`)
  await treeRow(page, 'Issuers').getByRole('button', { name: 'Toggle' }).click({ timeout: 15_000 })
  await treeRow(page, ISSUER_NAME).getByRole('button', { name: 'Toggle' }).click({ timeout: 15_000 })
  return treeRow(page, 'Holders').getByRole('button', { name: /join/ })
}

test('a permissionless holder join links to the website the issuer publishes', async ({ page }) => {
  await installTreeStubs(page, [
    { id: `${ISSUER_DID}#files`, type: 'relativeRef', serviceEndpoint: 'https://northwind.example/files' },
    { id: `${ISSUER_DID}#website`, type: 'LinkedDomains', serviceEndpoint: WEBSITE },
  ])

  await (await openHolders(page, PERMISSIONLESS_SCHEMA_ID)).click()

  await expect(treeRow(page, 'Holders').getByText('Permissionless', { exact: true })).toBeVisible()
  await expect(page.getByText("Get this credential from the issuer's website: northwind.example")).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByText(
      'No on-chain onboarding is needed for this credential, the issuer issues it directly from its Verifiable Service.'
    )
  ).toBeVisible()
  const link = page.getByRole('link', { name: "Visit the issuer's website" })
  await expect(link).toHaveAttribute('href', WEBSITE)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.getByText('I have read and accept the Ecosystem Governance Framework')).toHaveCount(0)
})

test('a permissionless holder join emails an issuer that publishes an email address', async ({ page }) => {
  await installTreeStubs(page, [
    { id: `${ISSUER_DID}#website`, type: 'LinkedDomains', serviceEndpoint: `mailto:${EMAIL}` },
  ])

  await (await openHolders(page, PERMISSIONLESS_SCHEMA_ID)).click()

  await expect(page.getByText(`Contact the issuer at ${EMAIL} to get this credential.`)).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('link', { name: 'Email the issuer' })).toHaveAttribute('href', `mailto:${EMAIL}`)
})

test('a permissionless holder join asks to contact an issuer that publishes no website', async ({ page }) => {
  await installTreeStubs(page, [
    { id: `${ISSUER_DID}#didcomm`, type: 'DIDCommMessaging', serviceEndpoint: { uri: 'wss://northwind.example' } },
  ])

  await (await openHolders(page, PERMISSIONLESS_SCHEMA_ID)).click()

  await expect(page.getByText(CONTACT_MESSAGE)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: "Visit the issuer's website" })).toHaveCount(0)
})

test('a schema without a holder onboarding mode sends the holder to the issuer like a permissionless one', async ({
  page,
}) => {
  await installTreeStubs(page, [{ id: `${ISSUER_DID}#website`, type: 'LinkedDomains', serviceEndpoint: WEBSITE }])

  await (await openHolders(page, UNSET_MODE_SCHEMA_ID)).click()

  await expect(treeRow(page, 'Holders').getByText('Permissionless', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: "Visit the issuer's website" })).toHaveAttribute('href', WEBSITE, {
    timeout: 15_000,
  })
})

test('a permissionless holder join says when the issuer services could not be loaded', async ({ page }) => {
  await installTreeStubs(page, [])
  const join = await openHolders(page, PERMISSIONLESS_SCHEMA_ID)
  await page.route('**/v4/verifiable-trust/resolve', (route) =>
    route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )

  await join.click()

  await expect(page.getByText("Could not load the issuer's services. Try again later.")).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText(CONTACT_MESSAGE)).toHaveCount(0)
})

test('a holder join through the issuer onboarding process needs an acting corporation', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await installTreeStubs(page, [])
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  const join = await openHolders(page, ISSUER_OP_SCHEMA_ID)

  await expect(join).toBeDisabled({ timeout: 15_000 })
  await expect(join).toHaveAttribute('title', 'Create or select a corporation before continuing.')
})
